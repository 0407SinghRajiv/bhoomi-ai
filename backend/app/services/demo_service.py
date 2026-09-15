from enum import Enum
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.reconciliation import ReconciliationCase
from app.models.verification import VerificationRequest
from app.models.audit import AuditLog


class DemoIdentity(str, Enum):
    DEMO_CITIZEN = "DEMO_CITIZEN"
    DEMO_AUTHORITY = "DEMO_AUTHORITY"


class DemoService:
    @staticmethod
    def get_cases(db: Session, skip: int = 0, limit: int = 100) -> List[ReconciliationCase]:
        return db.query(ReconciliationCase).order_by(ReconciliationCase.id.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_case_by_id_or_number(db: Session, identifier: str) -> Optional[ReconciliationCase]:
        query = db.query(ReconciliationCase).options(
            joinedload(ReconciliationCase.documents),
            joinedload(ReconciliationCase.results),
            joinedload(ReconciliationCase.conflicts),
            joinedload(ReconciliationCase.audit_logs),
        )
        if identifier.isdigit():
            case = query.filter(ReconciliationCase.id == int(identifier)).first()
            if case:
                return case
        return query.filter(ReconciliationCase.case_number == identifier).first()

    @staticmethod
    def get_verification_requests(db: Session, skip: int = 0, limit: int = 100) -> List[VerificationRequest]:
        return db.query(VerificationRequest).order_by(VerificationRequest.id.asc()).offset(skip).limit(limit).all()
