from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ExtractedFieldItem(BaseModel):
    id: Optional[int] = None
    field_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: float
    page_number: int
    bounding_box: Optional[List[float]] = None
    source_text: Optional[str] = None
    status: str  # EXTRACTED, MISSING, NEEDS_REVIEW, VERIFIED
    review_status: Optional[str] = None


class DocumentExtractionResponse(BaseModel):
    document_id: int
    file_name: str
    document_type_code: Optional[str] = None
    document_type_name: Optional[str] = None
    fields: List[ExtractedFieldItem]
    land_record: Optional[Dict[str, Any]] = None
