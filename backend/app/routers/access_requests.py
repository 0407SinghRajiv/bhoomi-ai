from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.access_request import AccessRequest
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestReview,
    AccessRequestRead,
)

router = APIRouter(prefix="/api/access-requests", tags=["Access Requests"])


@router.post("", response_model=AccessRequestRead, status_code=status.HTTP_201_CREATED)
def submit_access_request(
    payload: AccessRequestCreate,
    db: Session = Depends(get_db),
):
    """
    Submit an official request to access a restricted land record or parcel.
    """
    req = AccessRequest(
        applicant_name=payload.applicant_name,
        applicant_role=payload.applicant_role or "CITIZEN",
        applicant_contact=payload.applicant_contact,
        target_record_id=payload.target_record_id,
        target_parcel_id=payload.target_parcel_id,
        survey_number=payload.survey_number,
        village=payload.village,
        district=payload.district,
        owner_name=payload.owner_name,
        reason_category=payload.reason_category,
        reason_description=payload.reason_description,
        status="PENDING",
    )
    db.add(req)
    db.flush()

    # Create audit log
    audit = AuditLog(
        action="ACCESS_REQUEST_SUBMITTED",
        actor_type="CITIZEN",
        user=payload.applicant_name,
        role="CITIZEN",
        description=(
            f"Citizen {payload.applicant_name} submitted access request #{req.id} "
            f"for Survey No. {payload.survey_number} in {payload.village}, {payload.district}. "
            f"Reason: {payload.reason_category} - {payload.reason_description[:100]}"
        ),
    )
    db.add(audit)

    # Create notification for authority
    notif = Notification(
        recipient_type="DEMO_AUTHORITY",
        title=f"New Land Record Access Request: Survey {payload.survey_number}",
        message=(
            f"{payload.applicant_name} requested formal access to land records of "
            f"{payload.owner_name or 'parcel'} ({payload.survey_number}, {payload.village})."
        ),
    )
    db.add(notif)

    db.commit()
    db.refresh(req)
    return req


@router.get("", response_model=List[AccessRequestRead])
def list_access_requests(
    applicant_name: Optional[str] = Query(None, description="Filter by applicant name"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (PENDING, APPROVED, REJECTED)"),
    survey_number: Optional[str] = Query(None, description="Filter by survey number"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    List access requests with optional filters.
    """
    query = db.query(AccessRequest)

    if applicant_name:
        query = query.filter(AccessRequest.applicant_name.ilike(f"%{applicant_name.strip()}%"))
    if status_filter:
        query = query.filter(AccessRequest.status == status_filter.upper())
    if survey_number:
        query = query.filter(AccessRequest.survey_number.ilike(f"%{survey_number.strip()}%"))

    return query.order_by(AccessRequest.id.desc()).offset(skip).limit(limit).all()


@router.get("/{request_id}", response_model=AccessRequestRead)
def get_access_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a single access request detail.
    """
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Access request #{request_id} not found",
        )
    return req


@router.patch("/{request_id}/review", response_model=AccessRequestRead)
def review_access_request(
    request_id: int,
    payload: AccessRequestReview,
    db: Session = Depends(get_db),
):
    """
    Authority action to approve or reject an access request.
    """
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Access request #{request_id} not found",
        )

    review_status = payload.status.upper()
    if review_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either APPROVED or REJECTED",
        )

    req.status = review_status
    req.reviewed_by = payload.reviewed_by
    req.review_remarks = payload.review_remarks

    if review_status == "APPROVED":
        days = payload.valid_days if payload.valid_days and payload.valid_days > 0 else 30
        req.valid_until = datetime.now(timezone.utc) + timedelta(days=days)
    else:
        req.valid_until = None

    # Audit Log
    audit = AuditLog(
        action=f"ACCESS_REQUEST_{review_status}",
        actor_type="AUTHORITY",
        user=payload.reviewed_by,
        role="AUTHORITY",
        reason=payload.review_remarks,
        description=(
            f"Officer {payload.reviewed_by} {review_status.lower()} access request #{req.id} "
            f"for {req.applicant_name} (Survey No. {req.survey_number}). Remarks: {payload.review_remarks or 'N/A'}"
        ),
    )
    db.add(audit)

    # Citizen Notification
    notif = Notification(
        recipient_type="DEMO_CITIZEN",
        title=f"Access Request {review_status.capitalize()}: Survey {req.survey_number}",
        message=(
            f"Your request to inspect records for Survey No. {req.survey_number} in {req.village} "
            f"was {review_status.lower()} by {payload.reviewed_by}."
            + (f" Access valid for {payload.valid_days or 30} days." if review_status == "APPROVED" else "")
        ),
    )
    db.add(notif)

    db.commit()
    db.refresh(req)
    return req
