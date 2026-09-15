from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class CadastralParcel(Base):
    __tablename__ = "cadastral_parcels"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parcel_number = Column(String(100), nullable=False, index=True)
    survey_number = Column(String(100), nullable=False, index=True)
    khasra_number = Column(String(100), nullable=True, index=True)
    gat_number = Column(String(100), nullable=True, index=True)
    khata_number = Column(String(100), nullable=True, index=True)

    village = Column(String(100), nullable=False, index=True)
    tehsil = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, default="Maharashtra")

    area = Column(Float, nullable=False)
    area_unit = Column(String(50), nullable=False, default="Hectare")
    land_type = Column(String(100), nullable=False, default="Agricultural")

    owner_name = Column(String(255), nullable=False, index=True)
    owner_name_native = Column(String(255), nullable=True)
    owner_name_normalized = Column(String(255), nullable=True, index=True)

    record_id = Column(Integer, ForeignKey("land_records.id", ondelete="SET NULL"), nullable=True, index=True)
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)

    geometry = Column(Text, nullable=False)  # GeoJSON string for SQLite compatibility without PostGIS
    centroid_lat = Column(Float, nullable=False)
    centroid_lng = Column(Float, nullable=False)

    status = Column(String(50), nullable=False, default="NEEDS_REVIEW", index=True)
    confidence = Column(Float, nullable=False, default=0.95)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    land_record = relationship("LandRecord", back_populates="cadastral_parcels")
    source_document = relationship("Document")
