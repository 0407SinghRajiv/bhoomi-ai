import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.demo_service import DemoService
from app.services.reconciliation.reconciliation_engine import ReconciliationEngine
from app.schemas.reconciliation import (
    ReconciliationCaseRead,
    ReconciliationCaseDetail,
    TimelineEvent,
    ReconciliationRunRequest,
    ReconciliationRunResponse,
)

router = APIRouter(prefix="/api/reconciliation", tags=["Reconciliation Cases"])


@router.get("/cases", response_model=List[ReconciliationCaseRead])
def list_cases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    return DemoService.get_cases(db, skip=skip, limit=limit)


@router.post("/run", response_model=ReconciliationRunResponse)
def run_reconciliation(
    req: ReconciliationRunRequest,
    db: Session = Depends(get_db),
):
    """
    Executes actual field-level cross-document reconciliation across submitted document IDs.
    Normalizes whitespace, punctuation, case, OCR noise, Indian name transliterations,
    8 land units (Acre, Ha, Sq.m, Sq.ft, Guntha, Bigha, Cent, Decimal), and dates.
    Assigns match states: EXACT_MATCH, LIKELY_MATCH, MINOR_DIFFERENCE, CONFLICT, MISSING, NEEDS_REVIEW.
    Persists ReconciliationResult and Conflict records.
    """
    try:
        return ReconciliationEngine.reconcile_documents(
            db=db,
            document_ids=req.document_ids,
            case_id=req.case_id,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reconciliation engine failed: {str(e)}",
        )


@router.get("/cases/{case_id}", response_model=ReconciliationCaseDetail)
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
):
    case = DemoService.get_case_by_id_or_number(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reconciliation case '{case_id}' not found",
        )

    # Build timeline from audit logs
    timeline = [
        TimelineEvent(
            timestamp=log.created_at,
            action=log.action,
            actor_type=log.actor_type,
            description=log.description,
        )
        for log in sorted(case.audit_logs, key=lambda x: x.created_at)
    ]

    return ReconciliationCaseDetail(
        id=case.id,
        case_number=case.case_number,
        status=case.status,
        risk_level=case.risk_level,
        created_by_type=case.created_by_type,
        created_at=case.created_at,
        updated_at=case.updated_at,
        documents=case.documents,
        results=case.results,
        conflicts=case.conflicts,
        timeline=timeline,
    )


@router.patch("/conflicts/{conflict_id}/status")
def update_conflict_status(
    conflict_id: int,
    req: dict,
    db: Session = Depends(get_db),
):
    """
    Updates the review status of an identified conflict (OPEN, VERIFIED, RESOLVED, FLAGGED, UNDER_REVIEW).
    """
    from datetime import datetime, timezone
    from app.models.conflict import Conflict
    from app.models.audit import AuditLog

    conflict = db.query(Conflict).filter(Conflict.id == conflict_id).first()
    if not conflict:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict ID {conflict_id} not found",
        )

    new_status = req.get("status", "OPEN").upper()
    notes = req.get("notes", "")

    conflict.status = new_status
    if new_status == "RESOLVED":
        conflict.resolved_at = datetime.now(timezone.utc)
    else:
        conflict.resolved_at = None

    # Log audit entry
    audit = AuditLog(
        case_id=conflict.case_id,
        action="CONFLICT_STATUS_UPDATE",
        actor_type="DEMO_CITIZEN",
        description=f"Conflict '{conflict.field_name}' marked as '{new_status}'. {notes}".strip(),
    )
    db.add(audit)
    db.commit()

    return {
        "id": conflict.id,
        "case_id": conflict.case_id,
        "field_name": conflict.field_name,
        "status": conflict.status,
        "resolved_at": conflict.resolved_at.isoformat() if conflict.resolved_at else None,
        "message": f"Conflict status updated to {new_status}",
    }


@router.get("/cases/{case_id}/evidence", response_model=ReconciliationRunResponse)
def get_case_evidence(
    case_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves complete explainable evidence bundle with WHAT/WHY/WHERE citations
    and visual bounding box coordinates for split-screen inspection.
    """
    case = DemoService.get_case_by_id_or_number(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case '{case_id}' not found",
        )

    doc_ids = [d.id for d in case.documents]
    if not doc_ids or len(doc_ids) < 2:
        # Fallback to Maharashtra demo triad if case has insufficient documents
        from app.models.document import Document
        demo_docs = db.query(Document).order_by(Document.id.asc()).limit(3).all()
        doc_ids = [d.id for d in demo_docs]

    return ReconciliationEngine.reconcile_documents(
        db=db,
        document_ids=doc_ids,
        case_id=case.id,
    )

