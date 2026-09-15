from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AccessRequestCreate(BaseModel):
    applicant_name: str
    applicant_role: Optional[str] = "CITIZEN"
    applicant_contact: Optional[str] = None
    target_record_id: Optional[int] = None
    target_parcel_id: Optional[int] = None
    survey_number: str
    village: str
    district: str
    owner_name: Optional[str] = None
    reason_category: str
    reason_description: str


class AccessRequestReview(BaseModel):
    status: str  # APPROVED or REJECTED
    reviewed_by: str
    review_remarks: Optional[str] = None
    valid_days: Optional[int] = 30


class AccessRequestRead(BaseModel):
    id: int
    applicant_name: str
    applicant_role: str
    applicant_contact: Optional[str] = None
    target_record_id: Optional[int] = None
    target_parcel_id: Optional[int] = None
    survey_number: str
    village: str
    district: str
    owner_name: Optional[str] = None
    reason_category: str
    reason_description: str
    status: str
    reviewed_by: Optional[str] = None
    review_remarks: Optional[str] = None
    valid_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
