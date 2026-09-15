"""
OCRService Orchestrator
Dispatches pages to NativePDFExtractor or VisionOCREngine with quality gate.
Smart India Hackathon 2026 - Problem Statement 26018
"""
from typing import Optional, Dict, Any, List
from app.services.ocr.base import BaseOCREngine, PageOCRResult
from app.services.ocr.pdf_extractor import NativePDFExtractor
from app.services.ocr.vision_engine import VisionOCREngine
from app.services.quality_service import QualityGateService


class OCRService:
    def __init__(self):
        self.pdf_engine = NativePDFExtractor()
        self.vision_engine = VisionOCREngine()

    def process_page(
        self,
        page_number: int,
        image_path: str,
        pdf_path: Optional[str] = None,
        is_scanned: bool = False,
        native_text: Optional[str] = None,
        preferred_language: str = "auto",
    ) -> Dict[str, Any]:
        """
        Executes Quality Gate and OCR on a document page.
        Returns combined quality and OCR results.
        """
        # 1. Quality Gate Analysis
        quality_eval = QualityGateService.analyze_quality(image_path)

        # 2. Select Engine:
        # If native PDF with text stream available, use NativePDFExtractor
        if not is_scanned and pdf_path and native_text and len(native_text.strip()) > 10:
            ocr_result = self.pdf_engine.process_page(
                page_number=page_number,
                image_path=image_path,
                pdf_path=pdf_path,
                native_text=native_text,
                preferred_language=preferred_language,
            )
        else:
            # Scanned PDF or Image
            ocr_result = self.vision_engine.process_page(
                page_number=page_number,
                image_path=image_path,
                pdf_path=pdf_path,
                native_text=native_text,
                preferred_language=preferred_language,
            )

        return {
            "page_number": page_number,
            "quality": quality_eval,
            "ocr": ocr_result.model_dump(),
        }


ocr_service = OCRService()
