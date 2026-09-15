from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ExtractedFieldRead(BaseModel):
    id: int
    document_id: int
    field_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: Optional[float] = None
    page_number: Optional[int] = None
    bounding_box: Optional[str] = None
    source_text: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LandRecordRead(BaseModel):
    id: int
    document_id: Optional[int] = None
    owner_name: Optional[str] = None
    survey_number: Optional[str] = None
    gat_number: Optional[str] = None
    khasra_number: Optional[str] = None
    khata_number: Optional[str] = None
    village: Optional[str] = None
    taluka_tehsil: Optional[str] = None
    district: Optional[str] = None
    state_id: Optional[int] = None
    area_value: Optional[float] = None
    area_unit: Optional[str] = None
    land_type: Optional[str] = None
    mutation_number: Optional[str] = None
    registration_number: Optional[str] = None
    document_date: Optional[datetime] = None
    mutation_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
