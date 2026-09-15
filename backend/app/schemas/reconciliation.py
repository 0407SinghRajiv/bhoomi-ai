from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.document import DocumentRead


class ReconciliationResultRead(BaseModel):
    id: int
    case_id: int
    field_name: str
    status: str
    explanation: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConflictRead(BaseModel):
    id: int
    case_id: int
    field_name: str
    severity: str
    status: str
    explanation: str
    documents_involved: Optional[str] = None
    values: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReconciliationCaseRead(BaseModel):
    id: int
    case_number: str
    status: str
    risk_level: str
    created_by_type: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimelineEvent(BaseModel):
    timestamp: datetime
    action: str
    actor_type: str
    description: str


class ReconciliationCaseDetail(ReconciliationCaseRead):
    documents: List[DocumentRead] = []
    results: List[ReconciliationResultRead] = []
    conflicts: List[ConflictRead] = []
    timeline: List[TimelineEvent] = []

    model_config = ConfigDict(from_attributes=True)


# Run Request and Response Schemas
class ReconciliationRunRequest(BaseModel):
    document_ids: List[int]
    case_id: Optional[int] = None


class DocValueItem(BaseModel):
    doc_id: int
    file_name: str
    doc_type_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    page_number: Optional[int] = 1
    bounding_box: Optional[List[float]] = None
    source_text: Optional[str] = None
    confidence: Optional[float] = 0.90
    extraction_confidence_level: Optional[str] = "High"  # High, Medium, Low
    status: Optional[str] = "EXTRACTED"  # EXTRACTED, MISSING, NEEDS_REVIEW, VERIFIED


class WhereLocation(BaseModel):
    doc_id: int
    doc_title: str
    file_name: str
    page_number: int
    source_text: Optional[str] = None
    bounding_box: Optional[List[float]] = None
    confidence: float = 0.90
    extraction_confidence_level: str = "High"


class AreaComparisonItemSchema(BaseModel):
    doc_id: Optional[int] = None
    doc_title: str
    original: str
    numeric_value: float
    unit: str
    normalized_hectares: float
    normalized_sq_meters: float
    difference_hectares: float
    difference_pct: float
    tolerance_pct: float
    status: str


class AreaComparisonReportSchema(BaseModel):
    items: List[AreaComparisonItemSchema] = []
    baseline_doc: str
    baseline_hectares: float
    max_difference_pct: float
    tolerance_pct: float
    status: str
    explanation: str


class FieldEvaluationItem(BaseModel):
    field_key: str
    field_label: str
    category: str
    status: str
    severity: str
    operational_risk: str = "Low"  # Low, Medium, High, Critical
    extraction_confidence_level: str = "High"  # High, Medium, Low
    explanation: str
    what: Optional[str] = None
    why: Optional[str] = None
    where: List[WhereLocation] = []
    doc_values: List[DocValueItem] = []
    area_comparison: Optional[AreaComparisonReportSchema] = None


class DocumentSummaryItem(BaseModel):
    id: int
    file_name: str
    document_type_name: str
    document_type_code: str
    file_size: int
    language: str
    quality_status: str


class SummaryStats(BaseModel):
    total_fields: int
    exact_matches: int
    likely_matches: int
    minor_differences: int
    conflicts: int
    missing: int
    needs_review: int


class ConflictItem(BaseModel):
    id: int
    field_name: str
    severity: str
    status: str
    operational_risk: str = "High"  # Low, Medium, High, Critical
    explanation: str
    what: Optional[str] = None
    why: Optional[str] = None
    where: List[WhereLocation] = []
    documents_involved: List[str] = []
    values: Dict[str, Any] = {}


class RiskDimensionItem(BaseModel):
    name: str
    status: str
    severity: str
    score_impact: int
    explanation: str


class RiskAssessmentSchema(BaseModel):
    overall_risk: str
    risk_score: int
    risk_factors: List[str] = []
    risk_dimensions: Dict[str, RiskDimensionItem] = {}
    summary_explanation: str


class ConflictStatusUpdateRequest(BaseModel):
    status: str  # OPEN, VERIFIED, RESOLVED, FLAGGED, UNDER_REVIEW
    notes: Optional[str] = None


class ReconciliationRunResponse(BaseModel):
    case_id: int
    case_number: str
    status: str
    risk_level: str
    risk_assessment: Optional[RiskAssessmentSchema] = None
    documents_count: int
    documents: List[DocumentSummaryItem] = []
    summary_stats: SummaryStats
    fields: List[FieldEvaluationItem] = []
    conflicts: List[ConflictItem] = []
    executed_at: str

