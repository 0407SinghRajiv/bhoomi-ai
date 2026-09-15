import os
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.processing_job import DocumentProcessingJob
from app.models.ocr_result import OCRResult
from app.models.extracted_field import ExtractedField
from app.models.land_record import LandRecord
from app.services.storage_service import storage
from app.services.document_service import DocumentService
from app.services.quality_service import QualityGateService
from app.schemas.document import DocumentRead, DocumentDetailRead
from app.schemas.upload import (
    DocumentProcessingStatusResponse,
    PageOCRDetail,
    QualityGateReport,
)
from app.schemas.extraction_result import DocumentExtractionResponse, ExtractedFieldItem

router = APIRouter(prefix="/api/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.get("", response_model=List[DocumentRead])
def list_documents(
    state_id: Optional[int] = Query(None, description="Filter by state ID"),
    case_id: Optional[int] = Query(None, description="Filter by case ID"),
    demo_owner_type: Optional[str] = Query(None, description="Filter by demo owner type"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return DocumentService.get_documents(
        db,
        state_id=state_id,
        case_id=case_id,
        demo_owner_type=demo_owner_type,
        skip=skip,
        limit=limit,
    )


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    document_type_id: Optional[int] = Form(None),
    state_id: Optional[int] = Form(None),
    case_id: Optional[int] = Form(None),
    demo_owner_type: str = Form("DEMO_CITIZEN"),
    process_immediately: bool = Form(True),
    db: Session = Depends(get_db),
):
    """
    Upload and validate land record document (PDF, PNG, JPG, TIFF).
    Enforces format, size, empty file, and corruption checks.
    Immediately processes pages, runs quality gate and OCR.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a valid filename.",
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: PDF, PNG, JPG, JPEG, TIFF.",
        )

    # Read content and validate size
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 25MB (received {file_size / (1024*1024):.1f}MB).",
        )

    # Basic corruption check
    if ext == ".pdf":
        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupted or invalid PDF header.",
            )
    elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".tif"}:
        try:
            from PIL import Image
            import io
            with Image.open(io.BytesIO(content)) as img:
                img.verify()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupted or invalid image file.",
            )

    # Save to storage abstraction
    safe_filename = f"{Path(file.filename).stem}_{os.urandom(4).hex()}{ext}"
    relative_path = f"uploads/{safe_filename}"
    saved_disk_path = storage.save(relative_path, content)

    # Create Document record
    doc = Document(
        case_id=case_id,
        demo_owner_type=demo_owner_type,
        file_name=file.filename,
        file_path=saved_disk_path,
        file_type=file.content_type or f"application/{ext.lstrip('.')}",
        file_size=file_size,
        state_id=state_id,
        document_type_id=document_type_id,
        language="en",
        status="UPLOADED",
        quality_status="NOT_ANALYZED",
        page_count=1,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Process immediately
    if process_immediately:
        DocumentService.process_document(db, doc.id)
        db.refresh(doc)

    return {
        "message": "Document uploaded successfully",
        "document_id": doc.id,
        "file_name": doc.file_name,
        "status": doc.status,
        "quality_status": doc.quality_status,
        "page_count": doc.page_count,
    }


@router.get("/{document_id}/status", response_model=DocumentProcessingStatusResponse)
def get_document_status(
    document_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns real-time ingestion status, OCR Quality Gate report,
    and extracted OCR text with bounding boxes for all document pages.
    """
    doc = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found",
        )

    job = (
        db.query(DocumentProcessingJob)
        .filter(DocumentProcessingJob.document_id == document_id)
        .first()
    )

    pages = (
        db.query(DocumentPage)
        .filter(DocumentPage.document_id == document_id)
        .order_by(DocumentPage.page_number.asc())
        .all()
    )

    page_details = []
    for p in pages:
        ocr = db.query(OCRResult).filter(OCRResult.document_page_id == p.id).first()
        
        # Calculate or retrieve quality
        quality_info = QualityGateService.analyze_quality(p.image_path) if p.image_path and os.path.exists(p.image_path) else {
            "status": doc.quality_status,
            "width": p.width or 0,
            "height": p.height or 0,
            "blur_score": 100.0,
            "contrast_score": 50.0,
            "noise_score": 5.0,
            "skew_angle": 0.0,
            "rotation_degrees": 0,
            "is_high_resolution": True,
            "advisory_message": None,
            "reasons": [],
        }

        boxes = []
        if ocr and ocr.bounding_boxes:
            try:
                boxes = json.loads(ocr.bounding_boxes)
            except Exception:
                boxes = []

        page_details.append(PageOCRDetail(
            page_number=p.page_number,
            text=ocr.text if ocr and ocr.text else "",
            confidence=ocr.confidence if ocr and ocr.confidence is not None else 0.0,
            detected_language=ocr.language if ocr else doc.language,
            language_name="Marathi" if (ocr and ocr.language == "mr") else ("Hindi" if (ocr and ocr.language == "hi") else "English"),
            bounding_boxes=boxes,
            processing_time_ms=120.0,
            ocr_status=ocr.status if ocr else "PENDING",
            engine_name="BhoomiAI-OCR-Pipeline",
            quality=QualityGateReport(**quality_info),
        ))

    return DocumentProcessingStatusResponse(
        document_id=doc.id,
        file_name=doc.file_name,
        status=doc.status,
        progress=job.progress if job else (100 if doc.status == "COMPLETED" else 0),
        message=job.message if job else "Document ready",
        quality_status=doc.quality_status,
        page_count=doc.page_count,
        detected_language=doc.language,
        pages=page_details,
    )


@router.get("/{document_id}/pages/{page_number}/image")
def get_page_image(
    document_id: int,
    page_number: int,
    db: Session = Depends(get_db),
):
    """
    Serves the rendered page PNG preview image.
    """
    page = (
        db.query(DocumentPage)
        .filter(DocumentPage.document_id == document_id, DocumentPage.page_number == page_number)
        .first()
    )
    if not page or not page.image_path or not os.path.exists(page.image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rendered image for document {document_id} page {page_number} not found",
        )
    return FileResponse(page.image_path, media_type="image/png")


@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    download: bool = Query(False, description="Whether to trigger file download"),
    db: Session = Depends(get_db),
):
    """
    Serves the original uploaded/scanned document file (PDF or Image)
    for in-browser authentic viewing or download.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {document_id} not found")

    file_path = doc.file_path
    if not os.path.isabs(file_path):
        # Resolve relative to backend directory
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        resolved = os.path.join(backend_dir, file_path)
        if os.path.exists(resolved):
            file_path = resolved

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Original document file '{doc.file_name}' not found on storage disk",
        )

    media_type = doc.file_type or ("application/pdf" if doc.file_name.lower().endswith(".pdf") else "image/png")
    disposition = "attachment" if download else "inline"

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": f'{disposition}; filename="{doc.file_name}"'},
    )


@router.get("/{document_id}/pages/{page_number}")
def get_page_detail(
    document_id: int,
    page_number: int,
    db: Session = Depends(get_db),
):
    """
    Returns single page OCR detail, image preview link, dimensions, and bounding boxes.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {document_id} not found")

    page = db.query(DocumentPage).filter(
        DocumentPage.document_id == document_id,
        DocumentPage.page_number == page_number,
    ).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Page {page_number} not found for document {document_id}")

    ocr = db.query(OCRResult).filter(OCRResult.document_page_id == page.id).first()
    boxes = []
    if ocr and ocr.bounding_boxes:
        try:
            boxes = json.loads(ocr.bounding_boxes)
        except Exception:
            boxes = []

    return {
        "document_id": document_id,
        "page_number": page.page_number,
        "width": page.width,
        "height": page.height,
        "image_url": f"/api/documents/{document_id}/pages/{page_number}/image",
        "has_image": bool(page.image_path and os.path.exists(page.image_path)),
        "ocr_text": ocr.text if ocr else "",
        "confidence": ocr.confidence if ocr else 0.0,
        "bounding_boxes": boxes,
    }


@router.get("/{document_id}", response_model=DocumentDetailRead)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    doc = DocumentService.get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found",
        )
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    success = DocumentService.delete_document(db, document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found",
        )
    return {"message": f"Document {document_id} deleted successfully"}


@router.get("/{document_id}/extractions", response_model=DocumentExtractionResponse)
def get_document_extractions(
    document_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieves structured land record extraction fields and auto-detected document type.
    Extracts automatically if not yet extracted.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found",
        )

    # Check if extractions already exist
    existing_fields = (
        db.query(ExtractedField)
        .filter(ExtractedField.document_id == document_id)
        .order_by(ExtractedField.id.asc())
        .all()
    )

    if not existing_fields:
        return DocumentService.extract_document(db, document_id)

    # Fetch associated land record
    land_rec = db.query(LandRecord).filter(LandRecord.document_id == document_id).first()
    land_rec_dict = None
    if land_rec:
        land_rec_dict = {
            "owner_name": land_rec.owner_name,
            "survey_number": land_rec.survey_number,
            "gat_number": land_rec.gat_number,
            "khasra_number": land_rec.khasra_number,
            "khata_number": land_rec.khata_number,
            "village": land_rec.village,
            "taluka_tehsil": land_rec.taluka_tehsil,
            "district": land_rec.district,
            "area_value": land_rec.area_value,
            "area_unit": land_rec.area_unit,
            "land_type": land_rec.land_type,
            "mutation_number": land_rec.mutation_number,
            "registration_number": land_rec.registration_number,
            "document_date": land_rec.document_date.isoformat() if land_rec.document_date else None,
            "mutation_date": land_rec.mutation_date.isoformat() if land_rec.mutation_date else None,
        }

    fields_data = []
    for f in existing_fields:
        box = None
        if f.bounding_box:
            try:
                box = json.loads(f.bounding_box)
            except Exception:
                box = None
        fields_data.append(ExtractedFieldItem(
            id=f.id,
            field_name=f.field_name,
            raw_value=f.raw_value,
            normalized_value=f.normalized_value,
            confidence=f.confidence or 0.0,
            page_number=f.page_number or 1,
            bounding_box=box,
            source_text=f.source_text,
            status=f.status,
        ))

    doc_type_code = doc.document_type.code if doc.document_type else None
    doc_type_name = doc.document_type.name if doc.document_type else None

    return DocumentExtractionResponse(
        document_id=doc.id,
        file_name=doc.file_name,
        document_type_code=doc_type_code,
        document_type_name=doc_type_name,
        fields=fields_data,
        land_record=land_rec_dict,
    )


@router.post("/{document_id}/extract", response_model=DocumentExtractionResponse)
def reextract_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    """
    Forces structured extraction re-run on existing OCR outputs.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found",
        )
    return DocumentService.extract_document(db, document_id)

