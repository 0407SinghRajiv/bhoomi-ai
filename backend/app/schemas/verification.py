from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class VerificationRequestRead(BaseModel):
    id: int
    case_id: int
    status: str
    submitted_by_type: str
    request_message: Optional[str] = None
    authority_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationActionRead(BaseModel):
    id: int
    case_id: int
    action: str
    field_name: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    performed_by_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationSubmissionRequest(BaseModel):
    case_id: str
    message: Optional[str] = "Citizen request for revenue officer cross-document verification and title scrutiny."


class VerificationSubmissionResponse(BaseModel):
    success: bool
    case_id: int
    case_number: str
    status: str
    message: str
