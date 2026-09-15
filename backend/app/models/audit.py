from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    actor_type = Column(String(50), default="SYSTEM", nullable=False)
    user = Column(String(100), nullable=True)
    role = Column(String(100), nullable=True)
    field_name = Column(String(100), nullable=True)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)  # JSON formatted string
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    case = relationship("ReconciliationCase", back_populates="audit_logs")
    document = relationship("Document", foreign_keys=[document_id])

