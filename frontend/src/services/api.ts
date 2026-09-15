/**
 * BhoomiAI Frontend API Client
 * Connects React UI to FastAPI backend service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiState {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiDocumentType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  state_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiDocument {
  id: number;
  case_id: number | null;
  demo_owner_type: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  state_id: number | null;
  document_type_id: number | null;
  language: string;
  status: string;
  quality_status: string;
  page_count: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
  document_type?: ApiDocumentType;
  state?: ApiState;
}

export interface ApiExtractedField {
  id: number;
  document_id: number;
  field_name: string;
  raw_value: string | null;
  normalized_value: string | null;
  confidence: number | null;
  page_number: number | null;
  bounding_box: string | null;
  source_text: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiLandRecord {
  id: number;
  document_id: number | null;
  owner_name: string | null;
  survey_number: string | null;
  gat_number: string | null;
  khasra_number: string | null;
  khata_number: string | null;
  village: string | null;
  taluka_tehsil: string | null;
  district: string | null;
  state_id: number | null;
  area_value: number | null;
  area_unit: string | null;
  land_type: string | null;
  mutation_number: string | null;
  registration_number: string | null;
  document_date: string | null;
  mutation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiDocumentDetail extends ApiDocument {
  pages: Array<{
    id: number;
    document_id: number;
    page_number: number;
    image_path: string | null;
    width: number | null;
    height: number | null;
  }>;
  processing_jobs: Array<{
    id: number;
    job_type: string;
    status: string;
    progress: number;
    message: string | null;
  }>;
  extracted_fields: ApiExtractedField[];
  land_records: ApiLandRecord[];
}

export interface ApiConflict {
  id: number;
  case_id: number;
  field_name: string;
  severity: string;
  status: string;
  explanation: string;
  created_at: string;
  resolved_at: string | null;
}

export interface ApiReconciliationResult {
  id: number;
  case_id: number;
  field_name: string;
  status: string;
  explanation: string | null;
  created_at: string;
}

export interface ApiTimelineEvent {
  timestamp: string;
  action: string;
  actor_type: string;
  description: string;
}

export interface ApiReconciliationCase {
  id: number;
  case_number: string;
  status: string;
  risk_level: string;
  created_by_type: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDocValueItem {
  doc_id: number;
  file_name: string;
  doc_type_name: string;
  raw_value: string | null;
  normalized_value: string | null;
  page_number?: number;
  bounding_box?: number[] | null;
  source_text?: string | null;
  confidence?: number;
  extraction_confidence_level?: 'High' | 'Medium' | 'Low';
  status?: string;
}

export interface ApiWhereLocation {
  doc_id: number;
  doc_title: string;
  file_name: string;
  page_number: number;
  source_text?: string | null;
  bounding_box?: number[] | null;
  confidence: number;
  extraction_confidence_level: 'High' | 'Medium' | 'Low';
}

export interface ApiAreaComparisonItem {
  doc_id: number | null;
  doc_title: string;
  original: string;
  numeric_value: number;
  unit: string;
  normalized_hectares: number;
  normalized_sq_meters: number;
  difference_hectares: number;
  difference_pct: number;
  tolerance_pct: number;
  status: string;
}

export interface ApiAreaComparisonReport {
  items: ApiAreaComparisonItem[];
  baseline_doc: string;
  baseline_hectares: number;
  max_difference_pct: number;
  tolerance_pct: number;
  status: string;
  explanation: string;
}

export interface ApiFieldEvaluationItem {
  field_key: string;
  field_label: string;
  category: string;
  status: 'EXACT_MATCH' | 'LIKELY_MATCH' | 'MINOR_DIFFERENCE' | 'CONFLICT' | 'MISSING' | 'NEEDS_REVIEW' | string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE' | string;
  operational_risk?: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  extraction_confidence_level?: 'High' | 'Medium' | 'Low' | string;
  explanation: string;
  what?: string | null;
  why?: string | null;
  where?: ApiWhereLocation[];
  doc_values: ApiDocValueItem[];
  area_comparison?: ApiAreaComparisonReport | null;
}

export interface ApiReconciliationSummaryStats {
  total_fields: number;
  exact_matches: number;
  likely_matches: number;
  minor_differences: number;
  conflicts: number;
  missing: number;
  needs_review: number;
}

export interface ApiRiskDimensionItem {
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score_impact: number;
  explanation: string;
}

export interface ApiRiskAssessment {
  overall_risk: string;
  risk_score: number;
  risk_factors: string[];
  risk_dimensions: Record<string, ApiRiskDimensionItem>;
  summary_explanation: string;
}

export interface ApiReconciliationRunResponse {
  case_id: number;
  case_number: string;
  status: string;
  risk_level: string;
  risk_assessment?: ApiRiskAssessment | null;
  documents_count: number;
  documents: Array<{
    id: number;
    file_name: string;
    document_type_name: string;
    document_type_code: string;
    file_size: number;
    language: string;
    quality_status: string;
  }>;
  summary_stats: ApiReconciliationSummaryStats;
  fields: ApiFieldEvaluationItem[];
  conflicts: Array<{
    id: number;
    field_name: string;
    severity: string;
    status: string;
    operational_risk?: string;
    explanation: string;
    what?: string | null;
    why?: string | null;
    where?: ApiWhereLocation[];
    documents_involved: string[];
    values: Record<string, string>;
  }>;
  executed_at: string;
}


export interface ApiReconciliationCaseDetail extends ApiReconciliationCase {
  documents: ApiDocument[];
  results: ApiReconciliationResult[];
  conflicts: ApiConflict[];
  timeline: ApiTimelineEvent[];
}

export interface ApiVerificationRequest {
  id: number;
  case_id: number;
  status: string;
  submitted_by_type: string;
  request_message: string | null;
  authority_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface QualityGateReport {
  status: 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNREADABLE';
  width: number;
  height: number;
  blur_score: number;
  contrast_score: number;
  noise_score: number;
  skew_angle: number;
  rotation_degrees: number;
  is_high_resolution: boolean;
  advisory_message: string | null;
  reasons: string[];
}

export interface PageOCRDetail {
  page_number: number;
  text: string;
  confidence: number;
  detected_language: string;
  language_name: string;
  bounding_boxes: Array<{
    box: number[];
    text?: string;
    confidence?: number;
    line_number?: number;
  }>;
  processing_time_ms: number;
  ocr_status: string;
  engine_name: string;
  quality: QualityGateReport;
}

export interface DocumentProcessingStatusResponse {
  document_id: number;
  file_name: string;
  status: string;
  progress: number;
  message: string | null;
  quality_status: string;
  page_count: number;
  detected_language: string | null;
  pages: PageOCRDetail[];
}

export interface ApiExtractedFieldItem {
  id?: number;
  field_name: string;
  raw_value: string | null;
  normalized_value: string | null;
  confidence: number;
  page_number: number;
  bounding_box: number[] | null;
  source_text: string | null;
  status: 'EXTRACTED' | 'MISSING' | 'NEEDS_REVIEW' | 'VERIFIED' | string;
}

export interface ApiDocumentExtractionResponse {
  document_id: number;
  file_name: string;
  document_type_code: string | null;
  document_type_name: string | null;
  fields: ApiExtractedFieldItem[];
  land_record: Record<string, any> | null;
}


export interface AuthorityDashboardStats {
  pending_cases: number;
  high_priority: number;
  under_review: number;
  verified: number;
  rejected: number;
  escalated: number;
  total_cases: number;
  avg_review_time: string;
}

export interface FilterOptionsResponse {
  states: string[];
  districts: string[];
  talukas: string[];
  villages: string[];
  document_types: string[];
  risks: string[];
  statuses: string[];
}

export interface CaseQueueItem {
  id: number;
  case_number: string;
  citizen_submission_id: string;
  documents_count: number;
  document_types: string[];
  conflicts_count: number;
  risk_level: string;
  status: string;
  created_at: string;
  assigned_officer: string;
  state?: string | null;
  district?: string | null;
  taluka?: string | null;
  village?: string | null;
}

export interface TimelineEventDetail {
  id?: number | null;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  case_id?: number | null;
  field_name?: string | null;
  previous_value?: string | null;
  new_value?: string | null;
  reason?: string | null;
  description: string;
}

export interface DocumentOCRDetail {
  document_id: number;
  file_name: string;
  page_number: number;
  ocr_text: string;
  confidence?: number | null;
}

export interface AuthorityExtractedField {
  id: number;
  document_id: number;
  document_name: string;
  field_name: string;
  raw_value?: string | null;
  normalized_value?: string | null;
  confidence?: number | null;
  page_number?: number | null;
  bounding_box?: string | null;
  source_text?: string | null;
  status: string;
}

export interface AuthorityConflictDetail {
  id: number;
  case_id: number;
  field_name: string;
  severity: string;
  status: string;
  explanation: string;
  documents_involved?: string | null;
  values?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AuthorityCaseDetailFull {
  id: number;
  case_number: string;
  citizen_submission_id: string;
  status: string;
  risk_level: string;
  created_by_type: string;
  created_at: string;
  updated_at: string;
  assigned_officer: string;
  jurisdiction: {
    state?: string | null;
    district?: string | null;
    taluka?: string | null;
    village?: string | null;
    survey_number?: string | null;
  };
  documents: Array<{
    id: number;
    file_name: string;
    document_type_name: string;
    document_type_code: string;
    page_count: number;
    file_size: number;
    language: string;
    status: string;
    quality_status: string;
    uploaded_at: string;
  }>;
  ocr_transcripts: DocumentOCRDetail[];
  extracted_fields: AuthorityExtractedField[];
  conflicts: AuthorityConflictDetail[];
  reconciliation_results: Array<{
    id: number;
    field_name: string;
    status: string;
    explanation?: string | null;
  }>;
  risk_assessment: {
    overall_risk: string;
    risk_score: number;
    risk_factors: string[];
    extraction_confidence_level: string;
  };
  timeline: TimelineEventDetail[];
}

export interface OfficerActionPayload {
  action: string;
  reason: string;
  field_name?: string;
  field_id?: number;
  new_value?: string;
  conflict_id?: number;
  officer_name?: string;
  officer_role?: string;
}

export interface OfficerActionResponse {
  success: boolean;
  message: string;
  case_id: number;
  case_number: string;
  new_status: string;
  action: string;
  action_id?: number;
  audit_log_id?: number;
}


async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    console.warn(`[BhoomiAI API Warning] Failed request to ${endpoint}:`, message);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; service: string }>('/health'),

  // States
  getStates: () => request<ApiState[]>('/api/states'),

  // Document Types
  getDocumentTypes: (stateId?: number) => {
    const query = stateId ? `?state_id=${stateId}` : '';
    return request<ApiDocumentType[]>(`/api/document-types${query}`);
  },

  // Documents
  getDocuments: (params?: { state_id?: number; case_id?: number; demo_owner_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.state_id) searchParams.append('state_id', params.state_id.toString());
    if (params?.case_id) searchParams.append('case_id', params.case_id.toString());
    if (params?.demo_owner_type) searchParams.append('demo_owner_type', params.demo_owner_type);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<ApiDocument[]>(`/api/documents${queryString}`);
  },

  getDocument: (id: number) => request<ApiDocumentDetail>(`/api/documents/${id}`),

  deleteDocument: (id: number) =>
    request<{ message: string }>(`/api/documents/${id}`, { method: 'DELETE' }),

  uploadDocument: async (
    file: File,
    meta?: { document_type_id?: number; state_id?: number; case_id?: number; demo_owner_type?: string }
  ): Promise<{
    message: string;
    document_id: number;
    file_name: string;
    status: string;
    quality_status: string;
    page_count: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (meta?.document_type_id) formData.append('document_type_id', meta.document_type_id.toString());
    if (meta?.state_id) formData.append('state_id', meta.state_id.toString());
    if (meta?.case_id) formData.append('case_id', meta.case_id.toString());
    if (meta?.demo_owner_type) formData.append('demo_owner_type', meta.demo_owner_type);

    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let msg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errData = await response.json();
        if (errData.message) msg = errData.message;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    return response.json();
  },

  getDocumentStatus: (documentId: number) =>
    request<DocumentProcessingStatusResponse>(`/api/documents/${documentId}/status`),

  getPageImageUrl: (documentId: number, pageNumber: number) =>
    `${API_BASE_URL}/api/documents/${documentId}/pages/${pageNumber}/image`,

  getDocumentExtractions: (documentId: number) =>
    request<ApiDocumentExtractionResponse>(`/api/documents/${documentId}/extractions`),

  reextractDocument: (documentId: number) =>
    request<ApiDocumentExtractionResponse>(`/api/documents/${documentId}/extract`, {
      method: 'POST',
    }),

  // Reconciliation Cases & Engine
  runReconciliation: (documentIds: number[], caseId?: number) =>
    request<ApiReconciliationRunResponse>('/api/reconciliation/run', {
      method: 'POST',
      body: JSON.stringify({ document_ids: documentIds, case_id: caseId }),
    }),

  getCases: () => request<ApiReconciliationCase[]>('/api/reconciliation/cases'),

  getCaseDetail: (caseId: string | number) =>
    request<ApiReconciliationCaseDetail>(`/api/reconciliation/cases/${caseId}`),

  getCaseEvidence: (caseId: string | number) =>
    request<ApiReconciliationRunResponse>(`/api/reconciliation/cases/${caseId}/evidence`),

  updateConflictStatus: (conflictId: number, status: string, notes?: string) =>
    request<{ id: number; case_id: number; field_name: string; status: string; message: string }>(
      `/api/reconciliation/conflicts/${conflictId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }
    ),

  // Verification Requests
  getVerificationRequests: () =>
    request<ApiVerificationRequest[]>('/api/verification-requests'),

  // Authority Workflows (Phase 7)
  getAuthorityDashboardStats: () =>
    request<AuthorityDashboardStats>('/api/authority/dashboard-stats'),

  getAuthorityFilterOptions: () =>
    request<FilterOptionsResponse>('/api/authority/filter-options'),

  getAuthorityCases: (params?: {
    state?: string;
    district?: string;
    taluka?: string;
    village?: string;
    document_type?: string;
    risk?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.state && params.state !== 'ALL') searchParams.append('state', params.state);
    if (params?.district && params.district !== 'ALL') searchParams.append('district', params.district);
    if (params?.taluka && params.taluka !== 'ALL') searchParams.append('taluka', params.taluka);
    if (params?.village && params.village !== 'ALL') searchParams.append('village', params.village);
    if (params?.document_type && params.document_type !== 'ALL') searchParams.append('document_type', params.document_type);
    if (params?.risk && params.risk !== 'ALL') searchParams.append('risk', params.risk);
    if (params?.status && params.status !== 'ALL') searchParams.append('status', params.status);
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<CaseQueueItem[]>(`/api/authority/cases${qs}`);
  },

  getAuthorityCaseDetailFull: (caseId: string | number) =>
    request<AuthorityCaseDetailFull>(`/api/authority/cases/${caseId}`),

  executeOfficerAction: (caseId: string | number, payload: OfficerActionPayload) =>
    request<OfficerActionResponse>(`/api/authority/cases/${caseId}/actions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitCitizenVerification: (caseId: string | number, message?: string) =>
    request<{ success: boolean; case_id: number; case_number: string; status: string; message: string }>(
      '/api/verification/submit',
      {
        method: 'POST',
        body: JSON.stringify({ case_id: String(caseId), message }),
      }
    ),

  // Phase 8 Cadastral GIS & Land Records
  getCadastralParcels: (params?: { search?: string; village?: string; tehsil?: string; district?: string; status?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.village) sp.append('village', params.village);
    if (params?.tehsil) sp.append('tehsil', params.tehsil);
    if (params?.district) sp.append('district', params.district);
    if (params?.status) sp.append('status', params.status);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<ApiCadastralParcel[]>(`/api/cadastral-parcels${qs}`);
  },

  getCadastralParcelsGeoJSON: (params?: { search?: string; village?: string; district?: string }) => {
    const sp = new URLSearchParams();
    sp.append('as_geojson', 'true');
    if (params?.search) sp.append('search', params.search);
    if (params?.village) sp.append('village', params.village);
    if (params?.district) sp.append('district', params.district);
    return request<ApiCadastralGeoJSONCollection>(`/api/cadastral-parcels?${sp.toString()}`);
  },

  getCadastralParcelDetail: (id: number) =>
    request<ApiCadastralParcelDetail>(`/api/cadastral-parcels/${id}`),

  getCadastralParcelDocuments: (id: number) =>
    request<ApiCadastralDocumentSummary[]>(`/api/cadastral-parcels/${id}/documents`),

  getCadastralParcelReconciliation: (id: number) =>
    request<ApiCadastralReconciliationSummary>(`/api/cadastral-parcels/${id}/reconciliation`),

  verifyCadastralParcel: (id: number, payload: ApiParcelVerifyPayload) =>
    request<ApiCadastralParcelDetail>(`/api/cadastral-parcels/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getLandRecords: (params?: { search?: string; village?: string; district?: string; owner?: string; citizen_only?: boolean }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.owner) sp.append('owner', params.owner);
    if (params?.citizen_only) sp.append('citizen_only', 'true');
    if (params?.village) sp.append('village', params.village);
    if (params?.district) sp.append('district', params.district);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<ApiLandRecordSummary[]>(`/api/land-records${qs}`);
  },

  getLandRecordDetail: (id: number, requester_name?: string) => {
    const sp = requester_name ? `?requester_name=${encodeURIComponent(requester_name)}` : '';
    return request<ApiLandRecordDetail>(`/api/land-records/${id}${sp}`);
  },

  searchPublicRegistry: (params?: { search?: string; village?: string; citizen_name?: string }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.village) sp.append('village', params.village);
    if (params?.citizen_name) sp.append('citizen_name', params.citizen_name);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<ApiPublicRegistryParcel[]>(`/api/land-records/public-registry${qs}`);
  },

  createAccessRequest: (payload: ApiAccessRequestCreate) =>
    request<ApiAccessRequest>('/api/access-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAccessRequests: (params?: { applicant_name?: string; status?: string; survey_number?: string }) => {
    const sp = new URLSearchParams();
    if (params?.applicant_name) sp.append('applicant_name', params.applicant_name);
    if (params?.status) sp.append('status', params.status);
    if (params?.survey_number) sp.append('survey_number', params.survey_number);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<ApiAccessRequest[]>(`/api/access-requests${qs}`);
  },

  getAccessRequestDetail: (id: number) =>
    request<ApiAccessRequest>(`/api/access-requests/${id}`),

  reviewAccessRequest: (id: number, payload: ApiAccessRequestReview) =>
    request<ApiAccessRequest>(`/api/access-requests/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getDocumentFileUrl: (id: number, download: boolean = false) =>
    `${API_BASE_URL}/api/documents/${id}/file${download ? '?download=true' : ''}`,

  getDocumentPageDetail: (id: number, page: number) =>
    request<{
      document_id: number;
      page_number: number;
      width: number;
      height: number;
      image_url: string;
      has_image: boolean;
      ocr_text: string;
      confidence: number;
      bounding_boxes: any[];
    }>(`/api/documents/${id}/pages/${page}`),

  // Authority Analytics & Secure Repository
  getAuthorityAnalytics: () =>
    request<ComprehensiveAuthorityAnalytics>('/api/authority/analytics'),

  getAuthorityDocuments: (params?: {
    search?: string;
    quality_status?: string;
    document_type?: string;
    district?: string;
    skip?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.quality_status) sp.append('quality_status', params.quality_status);
    if (params?.document_type) sp.append('document_type', params.document_type);
    if (params?.district) sp.append('district', params.district);
    if (params?.skip !== undefined) sp.append('skip', params.skip.toString());
    if (params?.limit !== undefined) sp.append('limit', params.limit.toString());
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<ApiAuthorityDocumentItem[]>(`/api/authority/documents${qs}`);
  },

  getAuthorityDocumentDetail: (id: number) =>
    request<ApiAuthorityDocumentDetailBundle>(`/api/authority/documents/${id}`),

  updateAuthorityDocumentMetadata: (id: number, payload: ApiAuthorityDocumentMetadataUpdate) =>
    request<ApiAuthorityDocumentItem>(`/api/authority/documents/${id}/metadata`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};


export interface ApiCadastralParcel {
  id: number;
  parcel_number: string;
  survey_number: string;
  khasra_number?: string | null;
  gat_number?: string | null;
  khata_number?: string | null;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  area: number;
  area_unit: string;
  land_type: string;
  owner_name: string;
  owner_name_native?: string | null;
  owner_name_normalized?: string | null;
  status: string;
  confidence: number;
  centroid_lat: number;
  centroid_lng: number;
  record_id?: number | null;
  source_document_id?: number | null;
  geometry?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiCadastralGeoJSONFeature {
  type: 'Feature';
  id?: number;
  properties: ApiCadastralParcel & { notice?: string };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface ApiCadastralGeoJSONCollection {
  type: 'FeatureCollection';
  name: string;
  features: ApiCadastralGeoJSONFeature[];
}

export interface ApiCadastralDocumentSummary {
  id: number;
  file_name: string;
  document_type_code?: string | null;
  document_type_name?: string | null;
  status: string;
  page_count: number;
  file_type: string;
  uploaded_at: string;
}

export interface ApiCadastralReconciliationSummary {
  case_id?: number | null;
  case_number?: string | null;
  status: string;
  risk_level: string;
  results: Array<{ field_name: string; status: string; explanation: string }>;
  conflicts: Array<{ id: number; field_name: string; severity: string; status: string; explanation: string }>;
  conflicts_count: number;
}

export interface ApiCadastralParcelDetail extends ApiCadastralParcel {
  land_record?: Record<string, any> | null;
  documents: ApiCadastralDocumentSummary[];
  reconciliation?: ApiCadastralReconciliationSummary | null;
  geometry_geojson?: { type: string; coordinates: any } | null;
}

export interface ApiParcelVerifyPayload {
  owner_name?: string;
  survey_number?: string;
  area?: number;
  status?: string;
  reason: string;
  officer_name?: string;
}

export interface ApiLandRecordSummary {
  id: number;
  owner_name: string;
  owner_name_native?: string | null;
  survey_number: string;
  gat_number?: string | null;
  khasra_number?: string | null;
  khata_number?: string | null;
  village: string;
  taluka_tehsil: string;
  district: string;
  area_value: number;
  area_unit: string;
  land_type: string;
  mutation_number?: string | null;
  registration_number?: string | null;
  document_id?: number | null;
  document_name?: string | null;
  parcel_id?: number | null;
  parcel_number?: string | null;
  parcel_status: string;
  has_name_conflict?: boolean;
  conflicting_names?: string[];
  linked_documents_count?: number;
  created_at: string;
}

export interface ApiLandRecordDetail extends ApiLandRecordSummary {
  is_restricted?: boolean;
  is_owner?: boolean;
  access_status?: string;
  access_request_id?: number | null;
  access_valid_until?: string | null;
  cadastral_parcel?: ApiCadastralParcelDetail | null;
  documents: ApiCadastralDocumentSummary[];
  extractions: Array<{
    id: number;
    field_name: string;
    raw_value: string | null;
    normalized_value: string | null;
    confidence: number;
    page_number: number;
    bounding_box: number[] | null;
    source_text: string | null;
    status: string;
  }>;
  reconciliation?: ApiCadastralReconciliationSummary | null;
  name_conflict_detail?: {
    has_conflict: boolean;
    distinct_names: string[];
    variance_type: string;
    phonetic_similarity: number;
    primary_canonical_name: string;
    conflicting_variant: string;
    root_cause: string;
    recommendation: string;
    status: string;
  } | null;
  notice?: string;
}

export interface ApiPublicRegistryParcel {
  parcel_id: number;
  parcel_number: string;
  survey_number: string;
  gat_number?: string | null;
  village: string;
  tehsil: string;
  district: string;
  area: number;
  area_unit: string;
  land_type: string;
  owner_name: string;
  is_owner: boolean;
  access_status: 'OWNED' | 'APPROVED' | 'PENDING_REQUEST' | 'RESTRICTED' | 'REJECTED' | 'EXPIRED';
  access_request_id?: number | null;
  access_valid_until?: string | null;
  land_record_id?: number | null;
  status: string;
}

export interface ApiAccessRequestCreate {
  applicant_name: string;
  applicant_role?: string;
  applicant_contact?: string;
  target_record_id?: number | null;
  target_parcel_id?: number | null;
  survey_number: string;
  village: string;
  district: string;
  owner_name?: string | null;
  reason_category: string;
  reason_description: string;
}

export interface ApiAccessRequestReview {
  status: 'APPROVED' | 'REJECTED';
  reviewed_by: string;
  review_remarks?: string;
  valid_days?: number;
}

export interface ApiAccessRequest {
  id: number;
  applicant_name: string;
  applicant_role: string;
  applicant_contact?: string | null;
  target_record_id?: number | null;
  target_parcel_id?: number | null;
  survey_number: string;
  village: string;
  district: string;
  owner_name?: string | null;
  reason_category: string;
  reason_description: string;
  status: string;
  reviewed_by?: string | null;
  review_remarks?: string | null;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
}

// Authority Interactive Dashboards & Secure Repository Interfaces
export interface ApiAuthorityDocumentsStats {
  total_processed: number;
  total_pages_ocr: number;
  total_storage_mb: number;
  by_type: Record<string, number>;
}

export interface ApiAuthorityExtractionAccuracy {
  overall_accuracy: number;
  owner_name_accuracy: number;
  survey_number_accuracy: number;
  area_accuracy: number;
  mutation_accuracy: number;
  boundary_accuracy: number;
}

export interface ApiAuthorityErrorStatistics {
  quality_gate_failures: number;
  ocr_blur_contrast_warnings: number;
  skew_tilt_corrections: number;
  field_validation_mismatches: number;
  unresolved_conflicts: number;
}

export interface ApiDigitizationProgressItem {
  state: string;
  district: string;
  taluka?: string;
  target_parcels?: number;
  total_parcels?: number;
  digitized_parcels: number;
  verified_parcels?: number;
  percentage: number;
  status?: 'In Progress' | 'Completed' | 'Advanced' | string;
}

export interface ComprehensiveAuthorityAnalytics {
  documents_stats: ApiAuthorityDocumentsStats;
  extraction_accuracy: ApiAuthorityExtractionAccuracy;
  validation_status_breakdown: Record<string, number>;
  pending_cases: number;
  high_priority: number;
  total_conflicts: number;
  error_statistics: ApiAuthorityErrorStatistics;
  digitization_progress: ApiDigitizationProgressItem[];
  recent_activity_count: number;
}

export interface ApiAuthorityDocumentItem {
  id: number;
  file_name: string;
  document_type_code: string;
  document_type_name: string;
  file_type: string;
  file_size: number;
  language: string;
  quality_status: string;
  sha256_hash: string;
  uploaded_at: string;
  page_count: number;
  audit_events_count: number;
  case_id?: number | null;
  case_number?: string | null;
  owner_name?: string | null;
  survey_number?: string | null;
  village?: string | null;
  district?: string | null;
}

export interface ApiAuthorityDocumentAuditItem {
  id: number;
  action: string;
  actor_type: string;
  user: string;
  role: string;
  field_name?: string | null;
  previous_value?: string | null;
  new_value?: string | null;
  reason?: string | null;
  description: string;
  metadata_json?: string | null;
  created_at: string;
}

export interface ApiAuthorityDocumentDetailBundle {
  document: ApiAuthorityDocumentItem;
  audit_trail: ApiAuthorityDocumentAuditItem[];
  ocr_pages: Array<{
    page_number: number;
    width: number;
    height: number;
    confidence: number;
    text_preview: string;
    has_image: boolean;
  }>;
  extracted_fields: Array<{
    id: number;
    field_name: string;
    raw_value?: string | null;
    normalized_value?: string | null;
    confidence?: number | null;
    page_number?: number | null;
    status: string;
  }>;
}

export interface ApiAuthorityDocumentMetadataUpdate {
  document_type_id?: number;
  language?: string;
  quality_status?: string;
  survey_number?: string;
  village?: string;
  district?: string;
  remarks?: string;
  officer_name?: string;
}



