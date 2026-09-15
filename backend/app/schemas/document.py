from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.state import StateRead, DocumentTypeRead
from app.schemas.processing import ProcessingJobRead
from app.schemas.extraction import ExtractedFieldRead, LandRecordRead


class DocumentPageRead(BaseModel):
    id: int
    document_id: int
    page_number: int
    image_path: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentRead(BaseModel):
    id: int
    case_id: Optional[int] = None
    demo_owner_type: str
    file_name: str
    file_path: str
    file_type: str
    file_size: int
    state_id: Optional[int] = None
    document_type_id: Optional[int] = None
    language: str
    status: str
    quality_status: str
    page_count: int
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime
    document_type: Optional[DocumentTypeRead] = None
    state: Optional[StateRead] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentDetailRead(DocumentRead):
    pages: List[DocumentPageRead] = []
    processing_jobs: List[ProcessingJobRead] = []
    extracted_fields: List[ExtractedFieldRead] = []
    land_records: List[LandRecordRead] = []

    model_config = ConfigDict(from_attributes=True)
