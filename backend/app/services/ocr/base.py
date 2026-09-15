"""
Base OCR Engine Interface
Smart India Hackathon 2026 - Problem Statement 26018
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class OCRBoundingBox(BaseModel):
    box: List[float]  # [x0, y0, x1, y1] or polygon
    text: str
    confidence: float
    line_number: Optional[int] = None


class PageOCRResult(BaseModel):
    page_number: int
    text: str
    confidence: float
    detected_language: str
    language_name: str
    bounding_boxes: List[Dict[str, Any]]
    processing_time_ms: float
    ocr_status: str  # COMPLETED, FAILED
    engine_name: str


class BaseOCREngine(ABC):
    @abstractmethod
    def process_page(
        self,
        page_number: int,
        image_path: str,
        pdf_path: Optional[str] = None,
        native_text: Optional[str] = None,
        preferred_language: str = "auto",
    ) -> PageOCRResult:
        """Process page image or PDF and return structured OCR result."""
        pass
