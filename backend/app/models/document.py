from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    demo_owner_type = Column(String(50), default="DEMO_CITIZEN", nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="SET NULL"), nullable=True, index=True)
    document_type_id = Column(Integer, ForeignKey("document_types.id", ondelete="SET NULL"), nullable=True, index=True)
    language = Column(String(50), default="en", nullable=False)
    status = Column(String(50), default="UPLOADED", nullable=False, index=True)
    quality_status = Column(String(50), default="NOT_ANALYZED", nullable=False)
    page_count = Column(Integer, default=1, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    state = relationship("State", back_populates="documents")
    document_type = relationship("DocumentType", back_populates="documents")
    case = relationship("ReconciliationCase", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    processing_jobs = relationship("DocumentProcessingJob", back_populates="document", cascade="all, delete-orphan")
    extracted_fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    land_records = relationship("LandRecord", back_populates="document")
    gis_locations = relationship("GISLocation", back_populates="document")
