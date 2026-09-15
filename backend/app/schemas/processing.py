from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProcessingJobRead(BaseModel):
    id: int
    document_id: int
    job_type: str
    status: str
    progress: int
    message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OCRResultRead(BaseModel):
    id: int
    document_page_id: int
    language: str
    text: Optional[str] = None
    confidence: Optional[float] = None
    bounding_boxes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
