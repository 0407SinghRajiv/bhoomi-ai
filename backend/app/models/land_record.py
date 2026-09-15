from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_name = Column(String(255), nullable=True, index=True)
    survey_number = Column(String(100), nullable=True, index=True)
    gat_number = Column(String(100), nullable=True, index=True)
    khasra_number = Column(String(100), nullable=True, index=True)
    khata_number = Column(String(100), nullable=True, index=True)
    village = Column(String(100), nullable=True)
    taluka_tehsil = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="SET NULL"), nullable=True, index=True)
    area_value = Column(Float, nullable=True)
    area_unit = Column(String(50), nullable=True)
    land_type = Column(String(100), nullable=True)
    mutation_number = Column(String(100), nullable=True)
    registration_number = Column(String(100), nullable=True)
    document_date = Column(DateTime, nullable=True)
    mutation_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="land_records")
    state = relationship("State", back_populates="land_records")
    cadastral_parcels = relationship("CadastralParcel", back_populates="land_record")
