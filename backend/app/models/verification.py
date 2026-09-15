from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class VerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="PENDING", nullable=False)
    # PENDING, UNDER_REVIEW, NEEDS_CITIZEN_INPUT, APPROVED, REJECTED, ESCALATED, CLOSED
    submitted_by_type = Column(String(50), default="DEMO_CITIZEN", nullable=False)
    request_message = Column(Text, nullable=True)
    authority_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    case = relationship("ReconciliationCase", back_populates="verification_requests")


class VerificationAction(Base):
    __tablename__ = "verification_actions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    # FIELD_VERIFIED, FIELD_CORRECTED, CONFLICT_RESOLVED, DOCUMENT_REQUESTED, CLARIFICATION_REQUESTED, ESCALATED, APPROVED, REJECTED
    field_name = Column(String(100), nullable=True)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    performed_by_type = Column(String(50), default="DEMO_AUTHORITY", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    case = relationship("ReconciliationCase", back_populates="verification_actions")
