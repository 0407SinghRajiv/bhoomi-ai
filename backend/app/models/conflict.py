from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, RESOLVED, ESCALATED
    explanation = Column(Text, nullable=False)
    documents_involved = Column(Text, nullable=True)  # JSON-encoded list of document IDs or filenames
    values = Column(Text, nullable=True)  # JSON-encoded dictionary of {doc_id: raw_or_norm_value}
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    case = relationship("ReconciliationCase", back_populates="conflicts")
