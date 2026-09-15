import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Crosshair,
  Layers,
  ArrowLeft,
  Check,
  Flag,
  HelpCircle,
  FileSearch,
  Scale,
  Info,
  Loader2,
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { api } from '../../services/api';
import type {
  ApiReconciliationRunResponse,
  ApiFieldEvaluationItem,
  ApiWhereLocation,
} from '../../services/api';

export const CitizenEvidence: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryCaseId = searchParams.get('case_id') || 'CASE-MH-2026-001';
  const queryField = searchParams.get('field') || 'owner_name';
  const queryDocId = searchParams.get('doc_id');

  // Loading & Data States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [evidenceData, setEvidenceData] = useState<ApiReconciliationRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inspector States
  const [inspectorTab, setInspectorTab] = useState<'CONFLICTS' | 'ALL_FIELDS'>('CONFLICTS');
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>(queryField);

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Left Viewport States
  const [currentDocId, setCurrentDocId] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [showRiskBreakdown, setShowRiskBreakdown] = useState<boolean>(false);

  // Fetch complete evidence on load
  useEffect(() => {
    loadEvidence();
  }, [queryCaseId]);

  const loadEvidence = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch complete evidence report for this case
      const res = await api.getCaseEvidence(queryCaseId);
      setEvidenceData(res);


      if (res.documents && res.documents.length > 0) {
        // If a specific doc_id was requested in query params, honor it
        if (queryDocId && res.documents.some((d) => d.id === parseInt(queryDocId))) {
          setCurrentDocId(parseInt(queryDocId));
        } else {
          setCurrentDocId(res.documents[0].id);
        }
      }

      // If queryField is provided, ensure selected
      if (queryField && res.fields.some((f) => f.field_key === queryField)) {
        setSelectedFieldKey(queryField);
      } else if (res.conflicts.length > 0) {
        setSelectedFieldKey(res.conflicts[0].field_name);
      }
    } catch (err: any) {
      console.error('Failed to load evidence:', err);
      setError(err.message || 'Could not load cross-document evidence report.');
    } finally {
      setIsLoading(false);
    }
  };

  // Currently selected field item
  const selectedField: ApiFieldEvaluationItem | undefined = evidenceData?.fields.find(
    (f) => f.field_key === selectedFieldKey
  );

  // Documents involved in this case
  const comparedDocs = evidenceData?.documents || [];

  // Active document object
  const activeDoc = comparedDocs.find((d) => d.id === currentDocId) || comparedDocs[0];

  // Where citations for the active field
  const fieldWhereLocations: ApiWhereLocation[] = selectedField?.where || [];

  // Active Where entry for current document
  const activeDocWhere = fieldWhereLocations.find((w) => w.doc_id === currentDocId);

  // When selected field changes, auto-switch left document viewer to first document with evidence
  const handleSelectField = (fieldKey: string) => {
    setSelectedFieldKey(fieldKey);
    const targetField = evidenceData?.fields.find((f) => f.field_key === fieldKey);
    if (targetField && targetField.where && targetField.where.length > 0) {
      const firstLoc = targetField.where[0];
      setCurrentDocId(firstLoc.doc_id);
      setCurrentPage(firstLoc.page_number || 1);
    }
  };

  // Quick switch document to a specific citation
  const handleFocusCitation = (loc: ApiWhereLocation) => {
    setCurrentDocId(loc.doc_id);
    setCurrentPage(loc.page_number || 1);
  };

  // Zoom controls
  const handleZoomIn = () => setZoomScale((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoomScale(1.0);
  const handleFitZoom = () => setZoomScale(0.85);

  // Page navigation
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => p + 1);

  // Update Review Status
  const handleUpdateConflictStatus = async (newStatus: string) => {
    if (!evidenceData) return;
    const matchingConflict = evidenceData.conflicts.find((c) => c.field_name === selectedFieldKey);
    if (!matchingConflict) return;

    setIsUpdatingStatus(true);
    setActionSuccessMessage(null);
    try {
      await api.updateConflictStatus(matchingConflict.id, newStatus, `Citizen review update via Evidence Viewer`);
      matchingConflict.status = newStatus;
      setActionSuccessMessage(`Field status updated to ${newStatus} successfully.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Helpers for Status & Risk Badges
  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'EXACT_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Exact Match
          </span>
        );
      case 'LIKELY_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3 h-3" /> Likely Match
          </span>
        );
      case 'MINOR_DIFFERENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Info className="w-3 h-3" /> Minor Variance
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Potential Conflict
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3 h-3" /> Needs Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Missing
          </span>
        );
    }
  };

  const getExtractionConfidenceBadge = (level: string = 'High', confValue?: number) => {
    const pct = confValue ? `${Math.round(confValue * 100)}%` : '';
    switch (level) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            High {pct && `(${pct})`}
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Medium {pct && `(${pct})`}
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
            Low {pct && `(${pct})`}
          </span>
        );
    }
  };

  const getOperationalRiskBadge = (level: string = 'Low') => {
    switch (level) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-600 text-white shadow-xs">
            CRITICAL RISK
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500 text-white shadow-xs">
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yellow-400 text-slate-950">
            MEDIUM RISK
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500 text-white">
            LOW RISK
          </span>
        );
    }
  };

  // Coordinate normalizer for Bounding Box rendering
  // Bounding box format: [ymin, xmin, ymax, xmax] normalized (0 to 1)
  const renderBoundingOverlay = () => {
    if (!activeDocWhere || !activeDocWhere.bounding_box || activeDocWhere.bounding_box.length < 4) {
      return null;
    }
    const [c1, c2, c3, c4] = activeDocWhere.bounding_box;
    const top = `${Math.min(c1, c3) * 100}%`;
    const left = `${Math.min(c2, c4) * 100}%`;
    const height = `${Math.abs(c3 - c1) * 100}%`;
    const width = `${Math.abs(c4 - c2) * 100}%`;

    return (
      <div
        id="highlighted-source-region"
        className="absolute border-2 border-amber-500 bg-amber-400/20 rounded shadow-2xl transition-all duration-300 pointer-events-none ring-4 ring-amber-400/30 animate-pulse"
        style={{ top, left, width, height }}
      >
        <span className="absolute -top-7 left-0 bg-amber-600 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap font-bold flex items-center gap-1">
          <Crosshair className="w-3 h-3" />
          {selectedField?.field_label || selectedFieldKey} (Source Region)
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <PortalLayout
        portalType="citizen"
        title="Explainable Evidence Viewer"
        subtitle="Verifiable cross-document evidence tracing. Every extracted field and conflict is linked directly to physical document pages."
      >
        <div className="flex flex-col items-center justify-center p-24 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div className="text-sm font-semibold text-slate-700">
            Loading cross-document evidence and visual viewports...
          </div>
        </div>
      </PortalLayout>
    );
  }

  // Find matching conflict if any
  const currentConflict = evidenceData?.conflicts.find((c) => c.field_name === selectedFieldKey);

  return (
    <PortalLayout

      portalType="citizen"
      title="Explainable Evidence Viewer"
      subtitle="Verifiable cross-document evidence tracing. Every extracted field and conflict is linked directly to physical document pages."
    >
      <div className="space-y-6">

        {/* Top Header & Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              to="/citizen/analysis"
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition"
              title="Return to Triad Analysis"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {evidenceData?.case_number || queryCaseId}
                </span>
                <h1 className="text-base font-bold text-slate-900">
                  Cross-Document Evidence Inspector
                </h1>
                {evidenceData && getOperationalRiskBadge(evidenceData.risk_level)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparing {comparedDocs.length} cadastral instruments • Multi-layered Cadastral Normalization • Advisory AI
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowRiskBreakdown(!showRiskBreakdown)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showRiskBreakdown
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{showRiskBreakdown ? 'Hide 6 Risk Dimensions' : 'View 6 Risk Dimensions'}</span>
            </button>

            <Link
              to="/citizen/analysis"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Triad Grid</span>
            </Link>
          </div>
        </div>

        {/* Operational Risk Dimensions Drawer */}
        {showRiskBreakdown && evidenceData?.risk_assessment && (
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-xl border border-slate-700 shadow-lg space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
                  Cadastral Operational Risk Architecture (6 Core Dimensions)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Risk Score:</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {evidenceData.risk_assessment.risk_score} / 100
                </span>
                {getOperationalRiskBadge(evidenceData.risk_assessment.overall_risk)}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {evidenceData.risk_assessment.summary_explanation}
            </p>

            {/* 6 Dimensions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {Object.entries(evidenceData.risk_assessment.risk_dimensions).map(([key, dim]) => (
                <div
                  key={key}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition ${
                    dim.status === 'FAIL'
                      ? 'bg-rose-950/40 border-rose-700/60 text-rose-100'
                      : dim.status === 'WARN'
                      ? 'bg-amber-950/40 border-amber-700/60 text-amber-100'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{dim.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        dim.status === 'FAIL'
                          ? 'bg-rose-600 text-white'
                          : dim.status === 'WARN'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-600/80 text-white'
                      }`}
                    >
                      {dim.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {dim.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Success Toast */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionSuccessMessage}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Split-Screen Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Visual Document Viewport (7 cols)                            */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              
              {/* Document Tabs Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Document:
                  </span>
                  {comparedDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setCurrentDocId(doc.id);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                        currentDocId === doc.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{doc.document_type_name}</span>
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  {activeDoc?.file_name}
                </span>
              </div>

              {/* Viewport Control Bar: Zoom & Page Navigation */}
              <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                {/* Page Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-slate-600 px-1 text-xs">
                    Page <strong className="text-slate-900">{currentPage}</strong>
                  </span>
                  <button
                    onClick={handleNextPage}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Conflict Document Switcher Pills (If field involves multiple documents) */}
                {fieldWhereLocations.length > 1 && (
                  <div className="hidden md:flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      Inspect Source:
                    </span>
                    {fieldWhereLocations.map((loc) => (
                      <button
                        key={loc.doc_id}
                        onClick={() => handleFocusCitation(loc)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          currentDocId === loc.doc_id
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-amber-900 hover:bg-amber-100 border border-amber-300'
                        }`}
                      >
                        {loc.doc_title} (P.{loc.page_number})
                      </button>
                    ))}
                  </div>
                )}

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1 font-semibold text-slate-700 min-w-[40px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition ml-1"
                    title="Reset to 100%"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleFitZoom}
                    className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white transition"
                    title="Fit to Width"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Document Canvas Viewport */}
              <div className="relative min-h-[520px] max-h-[640px] overflow-auto bg-slate-950 flex items-center justify-center p-4 select-none">
                <div
                  className="relative transition-transform duration-200 origin-top shadow-2xl rounded"
                  style={{ transform: `scale(${zoomScale})` }}
                >
                  <img
                    id="document-viewport-image"
                    src={api.getPageImageUrl(currentDocId, currentPage)}
                    alt={`Document Page Preview (Doc ${currentDocId}, Page ${currentPage})`}
                    className="max-h-[600px] object-contain rounded bg-white"
                  />
                  {renderBoundingOverlay()}
                </div>

                {/* Empty State / Not Found Notice */}
                {!activeDoc && (
                  <div className="text-center text-slate-400 text-xs">
                    No document selected.
                  </div>
                )}
              </div>

              {/* Viewport Footer Bar */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono text-[11px]">
                    Viewing: <strong className="text-slate-900">{activeDoc?.document_type_name}</strong>
                  </span>
                </div>
                {activeDocWhere?.bounding_box ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Crosshair className="w-3 h-3" />
                    Bounding Region Active
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-slate-400">
                    No coordinate box on this document
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Explainable AI Inspector (5 cols)                           */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Top Selector: Conflicts vs All 17 Fields */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 w-full">
                <button
                  onClick={() => setInspectorTab('CONFLICTS')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
                    inspectorTab === 'CONFLICTS'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Conflicts ({evidenceData?.conflicts.length || 0})</span>
                </button>
                <button
                  onClick={() => setInspectorTab('ALL_FIELDS')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
                    inspectorTab === 'ALL_FIELDS'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>All Fields ({evidenceData?.fields.length || 17})</span>
                </button>
              </div>
            </div>

            {/* Field Picker Dropdown / Pill Scroller */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Select Cadastral Field to Inspect:
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {inspectorTab === 'CONFLICTS' ? 'Priority Flagged' : '17 Total'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(inspectorTab === 'CONFLICTS'
                  ? (evidenceData?.conflicts || []).map((c) => ({
                      key: c.field_name,
                      label: evidenceData?.fields.find((f) => f.field_key === c.field_name)?.field_label || c.field_name,
                      isConflict: true,
                    }))
                  : (evidenceData?.fields || []).map((f) => ({
                      key: f.field_key,
                      label: f.field_label,
                      isConflict: f.status === 'CONFLICT',
                    }))
                ).map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleSelectField(item.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                      selectedFieldKey === item.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : item.isConflict
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.isConflict && <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Inspection Card */}
            {selectedField ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
                
                {/* Field Header */}
                <div className="border-b border-slate-100 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedField.category}
                    </span>
                    {getMatchStatusBadge(selectedField.status)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedField.field_label}
                  </h2>
                </div>

                {/* DUAL METRICS: Extraction Confidence vs Operational Risk */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                      Extraction Confidence
                    </span>
                    <div>
                      {getExtractionConfidenceBadge(
                        selectedField.extraction_confidence_level || 'High',
                        selectedField.where?.[0]?.confidence
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Optical character clarity & OCR token certainty.
                    </span>
                  </div>

                  <div className="space-y-1 border-l border-slate-200 pl-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                      Operational Risk
                    </span>
                    <div>
                      {getOperationalRiskBadge(selectedField.operational_risk || 'Low')}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Cadastral title integrity & reconciliation delta.
                    </span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* WHAT? WHY? WHERE? EXPLAINABLE AI FRAMEWORK                                */}
                {/* ========================================================================= */}
                <div className="space-y-3.5 pt-1">
                  
                  {/* 1. WHAT? (What is different?) */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                      <FileSearch className="w-4 h-4 text-blue-600" />
                      <span>WHAT? (What is different across documents?)</span>
                    </div>

                    {/* Comparison Table of Values Across Instruments */}
                    <div className="overflow-x-auto bg-white rounded-lg border border-blue-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-mono text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-1.5">Document</th>
                            <th className="px-3 py-1.5">Extracted Value</th>
                            <th className="px-3 py-1.5">Normalized</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {selectedField.doc_values.map((dv) => (
                            <tr
                              key={dv.doc_id}
                              className={currentDocId === dv.doc_id ? 'bg-blue-50/50 font-medium' : ''}
                            >
                              <td className="px-3 py-2 text-slate-700 font-semibold">
                                {dv.doc_type_name}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-900">
                                {dv.raw_value || <span className="text-slate-400 italic">Not recorded</span>}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600">
                                {dv.normalized_value || <span className="text-slate-400">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-xs text-blue-950 font-medium leading-relaxed">
                      {selectedField.what}
                    </p>
                  </div>

                  {/* 2. WHY? (Why was it flagged?) */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      selectedField.status === 'CONFLICT'
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <HelpCircle
                        className={`w-4 h-4 ${
                          selectedField.status === 'CONFLICT' ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      />
                      <span>WHY? (Explainable AI Rationale)</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {selectedField.why || selectedField.explanation}
                    </p>
                  </div>

                  {/* 3. WHERE? (Where in the document was it found?) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                        <Crosshair className="w-4 h-4 text-slate-600" />
                        <span>WHERE? (Verifiable Source Citations)</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {fieldWhereLocations.length} Evidence Locations
                      </span>
                    </div>

                    {fieldWhereLocations.length > 0 ? (
                      <div className="space-y-2">
                        {fieldWhereLocations.map((loc, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border transition ${
                              currentDocId === loc.doc_id
                                ? 'bg-white border-blue-400 ring-1 ring-blue-300 shadow-xs'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-slate-900">
                                {loc.doc_title} (Page {loc.page_number})
                              </span>
                              <button
                                onClick={() => handleFocusCitation(loc)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition ${
                                  currentDocId === loc.doc_id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {currentDocId === loc.doc_id ? 'Viewing in Left Pane' : 'Focus in Viewer'}
                              </button>
                            </div>

                            <p className="font-mono text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                              "{loc.source_text}"
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                              <span>OCR Confidence: {Math.round(loc.confidence * 100)}%</span>
                              {loc.bounding_box && <span>Coordinates Verified</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500 italic bg-white rounded border border-slate-200">
                        No physical text citation detected in OCR pages.
                      </div>
                    )}
                  </div>

                </div>

                {/* Review Status & Citizen Actions */}
                {currentConflict && (
                  <div className="border-t border-slate-100 pt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                        Review Action:
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        Status: {currentConflict.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateConflictStatus('VERIFIED')}
                        disabled={isUpdatingStatus || currentConflict.status === 'VERIFIED'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm / Verify</span>
                      </button>

                      <button
                        onClick={() => handleUpdateConflictStatus('FLAGGED')}
                        disabled={isUpdatingStatus || currentConflict.status === 'FLAGGED'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Flag for Review</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
                Select a field or conflict to view explainable evidence.
              </div>
            )}

          </div>

        </div>

      </div>
    </PortalLayout>
  );
};

export default CitizenEvidence;
