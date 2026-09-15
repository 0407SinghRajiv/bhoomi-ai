from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    applicant_name = Column(String(255), nullable=False, index=True)
    applicant_role = Column(String(50), default="CITIZEN", nullable=False)
    applicant_contact = Column(String(100), nullable=True)
    
    # Target record and parcel
    target_record_id = Column(Integer, ForeignKey("land_records.id", ondelete="SET NULL"), nullable=True, index=True)
    target_parcel_id = Column(Integer, ForeignKey("cadastral_parcels.id", ondelete="SET NULL"), nullable=True, index=True)
    survey_number = Column(String(100), nullable=False, index=True)
    village = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    owner_name = Column(String(255), nullable=True)

    # Request details
    reason_category = Column(String(100), nullable=False)  # BOUNDARY_VERIFICATION, TITLE_DILIGENCE, LEGAL_SUCCESSION, EASEMENT_INQUIRY, OTHER
    reason_description = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED

    # Authority review
    reviewed_by = Column(String(255), nullable=True)
    review_remarks = Column(Text, nullable=True)
    valid_until = Column(DateTime, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    target_record = relationship("LandRecord", foreign_keys=[target_record_id])
    target_parcel = relationship("CadastralParcel", foreign_keys=[target_parcel_id])
