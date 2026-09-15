from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.demo_service import DemoService
from app.services.authority_service import AuthorityService
from app.schemas.verification import (
    VerificationRequestRead,
    VerificationSubmissionRequest,
    VerificationSubmissionResponse,
)

router = APIRouter(prefix="/api", tags=["Verification Requests"])


@router.get("/verification-requests", response_model=List[VerificationRequestRead])
def list_verification_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return DemoService.get_verification_requests(db, skip=skip, limit=limit)


@router.post("/verification/submit", response_model=VerificationSubmissionResponse)
def submit_verification_request(
    req: VerificationSubmissionRequest,
    db: Session = Depends(get_db),
):
    """
    Citizens submit analyzed case for revenue officer verification.
    Sets case status to PENDING_AUTHORITY_REVIEW and logs an audit trail event.
    """
    result = AuthorityService.submit_citizen_verification(db, req.case_id, req.message)
    return VerificationSubmissionResponse(**result)
