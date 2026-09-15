from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class AuditLogRead(BaseModel):
    id: int
    case_id: Optional[int] = None
    document_id: Optional[int] = None
    action: str
    actor_type: str
    user: Optional[str] = None
    role: Optional[str] = None
    description: str
    metadata_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationRead(BaseModel):
    id: int
    recipient_type: str
    case_id: Optional[int] = None
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthorityDashboardStats(BaseModel):
    pending_cases: int
    high_priority: int
    under_review: int
    verified: int
    rejected: int
    escalated: int
    total_cases: int
    avg_review_time: str = "3.8 min"


class FilterOptionsResponse(BaseModel):
    states: List[str]
    districts: List[str]
    talukas: List[str]
    villages: List[str]
    document_types: List[str]
    risks: List[str]
    statuses: List[str]


class CaseQueueItem(BaseModel):
    id: int
    case_number: str
    citizen_submission_id: str
    documents_count: int
    document_types: List[str]
    conflicts_count: int
    risk_level: str
    status: str
    created_at: datetime
    assigned_officer: str
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None


class OfficerActionRequest(BaseModel):
    action: str = Field(..., description="Action to perform: VERIFY_FIELD, EDIT_FIELD, RESOLVE_CONFLICT, REQUEST_DOCUMENT, REQUEST_CLARIFICATION, ESCALATE, APPROVE, REJECT")
    reason: str = Field(..., min_length=3, description="Mandatory officer reason / legal justification for the action")
    field_name: Optional[str] = None
    field_id: Optional[int] = None
    new_value: Optional[str] = None
    conflict_id: Optional[int] = None
    officer_name: Optional[str] = "Officer R. K. Patil (Tehsildar)"
    officer_role: Optional[str] = "Revenue Officer"


class OfficerActionResponse(BaseModel):
    success: bool
    message: str
    case_id: int
    case_number: str
    new_status: str
    action: str
    action_id: Optional[int] = None
    audit_log_id: Optional[int] = None


class TimelineEventDetail(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    user: str
    role: str
    action: str
    case_id: Optional[int] = None
    field_name: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    reason: Optional[str] = None
    description: str


class DocumentOCRDetail(BaseModel):
    document_id: int
    file_name: str
    page_number: int
    ocr_text: str
    confidence: Optional[float] = None


class AuthorityExtractedField(BaseModel):
    id: int
    document_id: int
    document_name: str
    field_name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    confidence: Optional[float] = None
    page_number: Optional[int] = None
    bounding_box: Optional[str] = None
    source_text: Optional[str] = None
    status: str


class AuthorityConflictDetail(BaseModel):
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


class AuthorityCaseDetailFull(BaseModel):
    id: int
    case_number: str
    citizen_submission_id: str
    status: str
    risk_level: str
    created_by_type: str
    created_at: datetime
    updated_at: datetime
    assigned_officer: str
    jurisdiction: Dict[str, Optional[str]]
    documents: List[Dict[str, Any]]
    ocr_transcripts: List[DocumentOCRDetail]
    extracted_fields: List[AuthorityExtractedField]
    conflicts: List[AuthorityConflictDetail]
    reconciliation_results: List[Dict[str, Any]]
    risk_assessment: Dict[str, Any]
    timeline: List[TimelineEventDetail]


class AuthorityDocumentItem(BaseModel):
    id: int
    case_id: Optional[int] = None
    file_name: str
    file_type: str
    file_size: int
    page_count: int
    uploaded_at: datetime
    status: str
    quality_status: str
    language: str
    demo_owner_type: str
    sha256_hash: str
    state_id: Optional[int] = None
    state_name: Optional[str] = None
    document_type_id: Optional[int] = None
    document_type_name: Optional[str] = None
    document_type_code: Optional[str] = None
    ocr_confidence: float
    fields_count: int
    survey_number: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    audit_events_count: int

    model_config = ConfigDict(from_attributes=True)


class AuthorityDocumentDetailBundle(BaseModel):
    document: AuthorityDocumentItem
    audit_trail: List[AuditLogRead]
    extracted_fields: List[Dict[str, Any]]
    pages: List[Dict[str, Any]]


class AuthorityDocumentMetadataUpdate(BaseModel):
    document_type_id: Optional[int] = None
    language: Optional[str] = None
    quality_status: Optional[str] = None
    demo_owner_type: Optional[str] = None
    village: Optional[str] = None
    survey_number: Optional[str] = None
    officer_name: str
    remarks: Optional[str] = None


class DigitizationProgressItem(BaseModel):
    state: str
    district: str
    taluka: Optional[str] = None
    target_parcels: int
    total_parcels: Optional[int] = None
    digitized_parcels: int
    verified_parcels: int
    percentage: float
    status: Optional[str] = "In Progress"


class ErrorStatistics(BaseModel):
    total_errors: int
    quality_gate_failures: int
    blur_contrast_flags: int
    skew_tilt_flags: int
    field_validation_mismatches: int
    unresolved_conflicts: int
    resolution_error_rate: float


class ExtractionAccuracyStats(BaseModel):
    overall_accuracy: float
    owner_name_accuracy: float
    survey_number_accuracy: float
    area_value_accuracy: float
    mutation_accuracy: float
    high_confidence_count: int
    low_confidence_flags: int


class ProcessedDocumentsStats(BaseModel):
    total_processed: int
    total_pages_ocr: int
    by_type: Dict[str, int]
    by_status: Dict[str, int]


class ComprehensiveAuthorityAnalytics(BaseModel):
    pending_cases: int
    high_priority: int
    under_review: int
    verified: int
    rejected: int
    escalated: int
    total_cases: int
    avg_review_time: str
    documents_stats: ProcessedDocumentsStats
    extraction_accuracy: ExtractionAccuracyStats
    validation_status_breakdown: Dict[str, int]
    error_statistics: ErrorStatistics
    digitization_progress: List[DigitizationProgressItem]

