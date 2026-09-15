import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload

from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.processing_job import DocumentProcessingJob
from app.models.ocr_result import OCRResult
from app.models.extracted_field import ExtractedField
from app.models.land_record import LandRecord
from app.models.state import DocumentType
from app.services.pdf_service import PDFProcessingService
from app.services.ocr.ocr_service import ocr_service
from app.services.quality_service import QualityGateService
from app.services.extraction.document_classifier import DocumentClassifier
from app.services.extraction.extractor import EntityExtractor

logger = logging.getLogger("bhoomiai.document_service")


class DocumentService:
    @staticmethod
    def get_documents(
        db: Session,
        state_id: Optional[int] = None,
        case_id: Optional[int] = None,
        demo_owner_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Document]:
        query = db.query(Document).options(
            joinedload(Document.state),
            joinedload(Document.document_type)
        )
        if state_id is not None:
            query = query.filter(Document.state_id == state_id)
        if case_id is not None:
            query = query.filter(Document.case_id == case_id)
        if demo_owner_type is not None:
            query = query.filter(Document.demo_owner_type == demo_owner_type)
        return query.order_by(Document.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_document_by_id(db: Session, document_id: int) -> Optional[Document]:
        return (
            db.query(Document)
            .options(
                joinedload(Document.state),
                joinedload(Document.document_type),
                joinedload(Document.pages).joinedload(DocumentPage.ocr_results),
                joinedload(Document.processing_jobs),
                joinedload(Document.extracted_fields),
                joinedload(Document.land_records),
            )
            .filter(Document.id == document_id)
            .first()
        )

    @staticmethod
    def delete_document(db: Session, document_id: int) -> bool:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return False
        db.delete(doc)
        db.commit()
        return True

    @staticmethod
    def extract_document(db: Session, document_id: int) -> Dict[str, Any]:
        """
        Runs or re-runs structured cadastral entity extraction on OCR output.
        Auto-detects document type, extracts entities, and populates ExtractedField and LandRecord.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            raise ValueError(f"Document {document_id} not found")

        # Load document pages with OCR results
        pages = (
            db.query(DocumentPage)
            .filter(DocumentPage.document_id == document_id)
            .order_by(DocumentPage.page_number.asc())
            .all()
        )

        pages_payload = []
        for p in pages:
            ocr = db.query(OCRResult).filter(OCRResult.document_page_id == p.id).first()
            boxes = []
            if ocr and ocr.bounding_boxes:
                try:
                    boxes = json.loads(ocr.bounding_boxes)
                except Exception:
                    boxes = []
            pages_payload.append({
                "page_number": p.page_number,
                "text": ocr.text if ocr else "",
                "bounding_boxes": boxes,
            })

        # 1. Document Type Auto-Detection if not set
        full_text = "\n".join(p["text"] for p in pages_payload)
        doc_type_code = None
        if doc.document_type:
            doc_type_code = doc.document_type.code

        classified = DocumentClassifier.classify(full_text)
        if not doc_type_code or doc_type_code == "GENERIC_LAND_RECORD":
            doc_type_code = classified["code"]
            # Look up matching DocumentType in database
            dt_obj = db.query(DocumentType).filter(DocumentType.code == classified["code"]).first()
            if dt_obj:
                doc.document_type_id = dt_obj.id

        # 2. Extract structured entities
        extracted_fields_data, land_record_dict = EntityExtractor.extract_from_pages(
            pages_payload,
            document_type_code=doc_type_code
        )

        # 3. Clear old extracted fields for clean reload
        db.query(ExtractedField).filter(ExtractedField.document_id == document_id).delete()

        # 4. Save new ExtractedField records
        created_fields = []
        for f in extracted_fields_data:
            box_str = json.dumps(f["bounding_box"]) if f.get("bounding_box") else None
            field_obj = ExtractedField(
                document_id=document_id,
                field_name=f["field_name"],
                raw_value=f.get("raw_value"),
                normalized_value=f.get("normalized_value"),
                confidence=f.get("confidence", 0.90),
                page_number=f.get("page_number", 1),
                bounding_box=box_str,
                source_text=f.get("source_text"),
                status=f.get("status", "EXTRACTED"),
            )
            db.add(field_obj)
            created_fields.append(field_obj)

        # 5. Create or update LandRecord
        land_record = db.query(LandRecord).filter(LandRecord.document_id == document_id).first()
        if not land_record:
            land_record = LandRecord(
                document_id=document_id,
                state_id=doc.state_id,
                **land_record_dict,
            )
            db.add(land_record)
        else:
            for k, v in land_record_dict.items():
                setattr(land_record, k, v)

        db.commit()
        db.refresh(doc)

        return {
            "document_id": document_id,
            "file_name": doc.file_name,
            "document_type_code": doc_type_code,
            "document_type_name": classified["name"] if classified else "Land Record",
            "fields": [
                {
                    "id": f.id,
                    "field_name": f.field_name,
                    "raw_value": f.raw_value,
                    "normalized_value": f.normalized_value,
                    "confidence": f.confidence,
                    "page_number": f.page_number,
                    "bounding_box": json.loads(f.bounding_box) if f.bounding_box else None,
                    "source_text": f.source_text,
                    "status": f.status,
                }
                for f in created_fields
            ],
            "land_record": land_record_dict,
        }

    @staticmethod
    def process_document(db: Session, document_id: int) -> Optional[Document]:
        """
        Executes complete ingestion pipeline:
        1. PDF / Image page splitting and rendering
        2. Pre-OCR Quality Gate
        3. Multilingual language identification
        4. OCR text and bounding boxes extraction
        5. Structured entity extraction & LandRecord persistence
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return None

        job = (
            db.query(DocumentProcessingJob)
            .filter(DocumentProcessingJob.document_id == document_id)
            .first()
        )
        now = datetime.now(timezone.utc)
        if not job:
            job = DocumentProcessingJob(
                document_id=document_id,
                job_type="EXTRACTION",
                status="PROCESSING",
                progress=10,
                message="Initializing document ingestion pipeline...",
                started_at=now,
            )
            db.add(job)
            db.flush()
        else:
            job.status = "PROCESSING"
            job.progress = 10
            job.message = "Initializing document ingestion pipeline..."
            job.started_at = now
            db.flush()

        doc.status = "PROCESSING"
        db.commit()

        try:
            file_path = Path(doc.file_path)
            ext = file_path.suffix.lower()

            # Update progress
            job.progress = 25
            job.message = "Splitting pages and rendering high-resolution viewports..."
            db.commit()

            # Render pages
            if ext == ".pdf":
                pages_meta = PDFProcessingService.inspect_and_render_pdf(str(file_path), doc.id)
            else:
                pages_meta = PDFProcessingService.inspect_and_render_image(str(file_path), doc.id)

            total_pages = max(1, len(pages_meta))
            quality_ratings = []
            detected_languages = []

            for page_info in pages_meta:
                page_num = page_info["page_number"]

                job.progress = int(30 + (page_num / total_pages * 40))
                job.message = f"Executing Quality Gate and OCR on page {page_num} of {total_pages}..."
                db.commit()

                # Create or update DocumentPage
                page_obj = (
                    db.query(DocumentPage)
                    .filter(DocumentPage.document_id == doc.id, DocumentPage.page_number == page_num)
                    .first()
                )
                if not page_obj:
                    page_obj = DocumentPage(
                        document_id=doc.id,
                        page_number=page_num,
                        image_path=page_info["image_path"],
                        width=page_info["width"],
                        height=page_info["height"],
                    )
                    db.add(page_obj)
                    db.flush()
                else:
                    page_obj.image_path = page_info["image_path"]
                    page_obj.width = page_info["width"]
                    page_obj.height = page_info["height"]
                    db.flush()

                # Run OCRService on page
                result = ocr_service.process_page(
                    page_number=page_num,
                    image_path=page_info["image_path"],
                    pdf_path=str(file_path) if ext == ".pdf" else None,
                    is_scanned=page_info["is_scanned"],
                    native_text=page_info.get("native_text"),
                )

                quality = result["quality"]
                ocr = result["ocr"]
                quality_ratings.append(quality["status"])
                detected_languages.append(ocr["detected_language"])

                # Upsert OCRResult
                ocr_obj = (
                    db.query(OCRResult)
                    .filter(OCRResult.document_page_id == page_obj.id)
                    .first()
                )
                if not ocr_obj:
                    ocr_obj = OCRResult(
                        document_page_id=page_obj.id,
                        language=ocr["detected_language"],
                        text=ocr["text"],
                        confidence=ocr["confidence"],
                        bounding_boxes=json.dumps(ocr["bounding_boxes"]),
                        status=ocr["ocr_status"],
                    )
                    db.add(ocr_obj)
                else:
                    ocr_obj.language = ocr["detected_language"]
                    ocr_obj.text = ocr["text"]
                    ocr_obj.confidence = ocr["confidence"]
                    ocr_obj.bounding_boxes = json.dumps(ocr["bounding_boxes"])
                    ocr_obj.status = ocr["ocr_status"]

                db.commit()

            # Determine overall quality and primary language
            if "UNREADABLE" in quality_ratings:
                overall_quality = "UNREADABLE"
            elif "POOR" in quality_ratings:
                overall_quality = "POOR"
            elif "ACCEPTABLE" in quality_ratings:
                overall_quality = "ACCEPTABLE"
            else:
                overall_quality = "GOOD"

            primary_lang = max(set(detected_languages), key=detected_languages.count) if detected_languages else "en"

            doc.page_count = len(pages_meta)
            doc.quality_status = overall_quality
            doc.language = primary_lang
            db.commit()

            # Phase 4 Step: Structured Cadastral Entity Extraction
            job.progress = 85
            job.message = "Running structured entity extraction and normalizer..."
            db.commit()

            DocumentService.extract_document(db, doc.id)

            doc.status = "COMPLETED"
            job.status = "COMPLETED"
            job.progress = 100
            job.message = f"Processing and structured extraction complete ({doc.page_count} page(s))."
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

            logger.info(f"Document {document_id} processed and extracted successfully.")
            return doc

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}", exc_info=True)
            doc.status = "FAILED"
            job.status = "FAILED"
            job.progress = 100
            job.message = f"Processing failed: {str(e)}"
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            return doc
