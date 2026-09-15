from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class GISLocation(Base):
    __tablename__ = "gis_locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("reconciliation_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    village = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    survey_number = Column(String(100), nullable=True)
    geometry_data = Column(Text, nullable=True)  # GeoJSON string for SQLite compatibility without PostGIS
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    case = relationship("ReconciliationCase", back_populates="gis_locations")
    document = relationship("Document", back_populates="gis_locations")
