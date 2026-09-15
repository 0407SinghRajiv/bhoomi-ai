from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class QualityGateReport(BaseModel):
    status: str  # GOOD, ACCEPTABLE, POOR, UNREADABLE
    width: int
    height: int
    blur_score: float
    contrast_score: float
    noise_score: float
    skew_angle: float
    rotation_degrees: int
    is_high_resolution: bool
    advisory_message: Optional[str] = None
    reasons: List[str] = []


class PageOCRDetail(BaseModel):
    page_number: int
    text: str
    confidence: float
    detected_language: str
    language_name: str
    bounding_boxes: List[Dict[str, Any]]
    processing_time_ms: float
    ocr_status: str
    engine_name: str
    quality: QualityGateReport


class DocumentProcessingStatusResponse(BaseModel):
    document_id: int
    file_name: str
    status: str  # UPLOADED, PROCESSING, COMPLETED, FAILED
    progress: int
    message: Optional[str] = None
    quality_status: str
    page_count: int
    detected_language: Optional[str] = None
    pages: List[PageOCRDetail] = []
