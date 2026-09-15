from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class CadastralParcelBase(BaseModel):
    parcel_number: str
    survey_number: str
    khasra_number: Optional[str] = None
    gat_number: Optional[str] = None
    khata_number: Optional[str] = None
    village: str
    tehsil: str
    district: str
    state: str = "Maharashtra"
    area: float
    area_unit: str = "Hectare"
    land_type: str = "Agricultural"
    owner_name: str
    owner_name_native: Optional[str] = None
    owner_name_normalized: Optional[str] = None
    status: str = "NEEDS_REVIEW"
    confidence: float = 0.95
    centroid_lat: float
    centroid_lng: float


class CadastralParcelRead(CadastralParcelBase):
    id: int
    record_id: Optional[int] = None
    source_document_id: Optional[int] = None
    geometry: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CadastralGeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[int] = None
    properties: Dict[str, Any]
    geometry: Dict[str, Any]


class CadastralGeoJSONCollection(BaseModel):
    type: str = "FeatureCollection"
    name: str = "Cadastral_Parcels"
    features: List[CadastralGeoJSONFeature]


class ParcelVerifyRequest(BaseModel):
    owner_name: Optional[str] = None
    survey_number: Optional[str] = None
    area: Optional[float] = None
    status: Optional[str] = Field(None, description="VERIFIED, NEEDS_REVIEW, or REJECTED")
    reason: str = Field(..., min_length=3, description="Mandatory officer reason / justification")
    officer_name: Optional[str] = "Revenue Officer / Circle Inspector"


class CadastralDocumentSummary(BaseModel):
    id: int
    file_name: str
    document_type_code: Optional[str] = None
    document_type_name: Optional[str] = None
    status: str
    page_count: int
    file_type: str
    uploaded_at: datetime


class CadastralReconciliationSummary(BaseModel):
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    status: str
    risk_level: str
    results: List[Dict[str, Any]]
    conflicts: List[Dict[str, Any]]
    conflicts_count: int


class CadastralParcelDetail(CadastralParcelRead):
    land_record: Optional[Dict[str, Any]] = None
    documents: List[CadastralDocumentSummary] = []
    reconciliation: Optional[CadastralReconciliationSummary] = None
    geometry_geojson: Optional[Dict[str, Any]] = None
