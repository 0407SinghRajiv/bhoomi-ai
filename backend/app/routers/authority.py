from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.authority import (
    AuditLogRead,
    NotificationRead,
    AuthorityDashboardStats,
    FilterOptionsResponse,
    CaseQueueItem,
    AuthorityCaseDetailFull,
    OfficerActionRequest,
    OfficerActionResponse,
    ComprehensiveAuthorityAnalytics,
    AuthorityDocumentItem,
    AuthorityDocumentDetailBundle,
    AuthorityDocumentMetadataUpdate,
)
from app.services.authority_service import AuthorityService

router = APIRouter(prefix="/api/authority", tags=["Authority"])


@router.get("/dashboard-stats", response_model=AuthorityDashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
):
    """
    Returns actual database counts for:
    Pending Cases, High Priority, Under Review, Verified, Rejected, Escalated, Total Cases.
    """
    return AuthorityService.get_dashboard_stats(db)


@router.get("/filter-options", response_model=FilterOptionsResponse)
def get_filter_options(
    db: Session = Depends(get_db),
):
    """
    Returns distinct geographic, document type, risk, and status options from the live database.
    """
    return AuthorityService.get_filter_options(db)


@router.get("/cases", response_model=List[CaseQueueItem])
def list_authority_cases(
    state: Optional[str] = Query(None, description="State filter"),
    district: Optional[str] = Query(None, description="District filter"),
    taluka: Optional[str] = Query(None, description="Taluka/Tehsil filter"),
    village: Optional[str] = Query(None, description="Village filter"),
    document_type: Optional[str] = Query(None, description="Document type filter"),
    risk: Optional[str] = Query(None, description="Risk level filter: CRITICAL, HIGH, MEDIUM, LOW"),
    status: Optional[str] = Query(None, description="Status filter"),
    date_from: Optional[str] = Query(None, description="Date from (ISO format)"),
    date_to: Optional[str] = Query(None, description="Date to (ISO format)"),
    search: Optional[str] = Query(None, description="Search term for case ID, citizen ID, village, etc."),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Returns the unified verification case queue with multi-dimensional filtering.
    """
    return AuthorityService.query_case_queue(
        db=db,
        state=state,
        district=district,
        taluka=taluka,
        village=village,
        document_type=document_type,
        risk=risk,
        status_filter=status,
        date_from=date_from,
        date_to=date_to,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/cases/{case_id}", response_model=AuthorityCaseDetailFull)
def get_authority_case_detail(
    case_id: str = Path(..., description="Case number or ID"),
    db: Session = Depends(get_db),
):
    """
    Returns complete workbench bundle: Documents, OCR, Extracted Fields, Conflicts, Evidence, Confidence, Risk, and Timeline.
    """
    return AuthorityService.get_case_detail_full(db, case_id)


@router.post("/cases/{case_id}/actions", response_model=OfficerActionResponse)
def execute_officer_action(
    req: OfficerActionRequest,
    case_id: str = Path(..., description="Case number or ID"),
    db: Session = Depends(get_db),
):
    """
    Executes an official verification action:
    VERIFY_FIELD, EDIT_FIELD, RESOLVE_CONFLICT, REQUEST_DOCUMENT, REQUEST_CLARIFICATION, ESCALATE, APPROVE, REJECT.
    Enforces mandatory officer reason / justification.
    """
    return AuthorityService.execute_officer_action(db, case_id, req)


@router.get("/audit-logs", response_model=List[AuditLogRead])
def list_audit_logs(
    case_id: Optional[int] = Query(None, description="Optional case ID filter"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if case_id is not None:
        query = query.filter(AuditLog.case_id == case_id)
    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/notifications", response_model=List[NotificationRead])
def list_notifications(
    recipient_type: Optional[str] = Query("DEMO_AUTHORITY", description="Recipient type"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Notification)
    if recipient_type:
        query = query.filter(Notification.recipient_type == recipient_type)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/analytics", response_model=ComprehensiveAuthorityAnalytics)
def get_authority_analytics(
    db: Session = Depends(get_db),
):
    """
    Returns executive metrics for authority command center:
    - Total documents processed and breakdown by type/status
    - OCR & entity extraction accuracy metrics
    - Validation status distribution
    - Pending verification cases and risk breakdown
    - Error statistics (quality gate checks, blur, skew, unresolved conflicts)
    - State-wise and district-wise digitization progress
    """
    return AuthorityService.get_comprehensive_analytics(db)


@router.get("/documents", response_model=List[AuthorityDocumentItem])
def list_authority_documents(
    state_id: Optional[int] = Query(None, description="Filter by state ID"),
    district: Optional[str] = Query(None, description="Filter by district"),
    document_type_id: Optional[int] = Query(None, description="Filter by document type ID"),
    quality_status: Optional[str] = Query(None, description="Filter by quality status (PASSED, WARNING, FAILED)"),
    search: Optional[str] = Query(None, description="Search by file name, owner type, language"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Secure document repository for authorities with metadata management,
    cryptographic SHA-256 signatures, and audit event counts.
    """
    return AuthorityService.list_authority_documents(
        db=db,
        state_id=state_id,
        district=district,
        document_type_id=document_type_id,
        quality_status=quality_status,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get("/documents/{doc_id}", response_model=AuthorityDocumentDetailBundle)
def get_authority_document_detail(
    doc_id: int = Path(..., description="Document ID"),
    db: Session = Depends(get_db),
):
    """
    Returns full document inspection bundle: metadata, extracted fields, pages,
    and immutable historical audit trail.
    """
    return AuthorityService.get_authority_document_detail(db, doc_id)


@router.patch("/documents/{doc_id}/metadata", response_model=AuthorityDocumentItem)
def update_document_metadata(
    payload: AuthorityDocumentMetadataUpdate,
    doc_id: int = Path(..., description="Document ID"),
    db: Session = Depends(get_db),
):
    """
    Officer action to update document metadata (document type, quality flag, language, owner type, village/survey).
    Automatically creates an immutable AuditLog entry with officer name and remarks.
    """
    return AuthorityService.update_document_metadata(db, doc_id, payload)

