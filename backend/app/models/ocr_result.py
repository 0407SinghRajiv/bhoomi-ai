from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_page_id = Column(Integer, ForeignKey("document_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(50), default="en", nullable=False)
    text = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)
    bounding_boxes = Column(Text, nullable=True)  # JSON-encoded bounding boxes for SQLite compatibility
    status = Column(String(50), default="COMPLETED", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    page = relationship("DocumentPage", back_populates="ocr_results")
