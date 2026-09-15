from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class ReconciliationCase(Base):
    __tablename__ = "reconciliation_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_number = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), default="DRAFT", nullable=False, index=True)
    # DRAFT, PROCESSING, COMPLETED, PENDING_REVIEW, UNDER_VERIFICATION, APPROVED, REJECTED, ESCALATED, CLOSED
    risk_level = Column(String(50), default="LOW", nullable=False, index=True)
    # LOW, MEDIUM, HIGH, CRITICAL
    created_by_type = Column(String(50), default="DEMO_CITIZEN", nullable=False)
    assigned_officer = Column(String(100), default="Officer R. K. Patil (Tehsildar)", nullable=True)
    citizen_submission_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    documents = relationship("Document", back_populates="case")
    results = relationship("ReconciliationResult", back_populates="case", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="case", cascade="all, delete-orphan")
    verification_requests = relationship("VerificationRequest", back_populates="case", cascade="all, delete-orphan")
    verification_actions = relationship("VerificationAction", back_populates="case", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="case")
    gis_locations = relationship("GISLocation", back_populates="case")
    notifications = relationship("Notification", back_populates="case")


class ReconciliationResult(Base):
    __tablename__ = "reconciliation_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    # EXACT_MATCH, LIKELY_MATCH, MINOR_DIFFERENCE, CONFLICT, MISSING, NEEDS_REVIEW
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    case = relationship("ReconciliationCase", back_populates="results")
