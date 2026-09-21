import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  FileText,
  ShieldAlert,
  ArrowRight,
  Info,
  Scale,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { api } from '../../services/api';
import type {
  ApiDocument,
  ApiReconciliationRunResponse,
  ApiFieldEvaluationItem,
} from '../../services/api';

export const CitizenAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Document selection state
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);

  // Reconciliation run state
  const [reconciliationData, setReconciliationData] = useState<ApiReconciliationRunResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal/drawer state
  const [activeField, setActiveField] = useState<ApiFieldEvaluationItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Authority Verification Submission State (Phase 7 Real Flow)
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [citizenMessage, setCitizenMessage] = useState<string>('Requesting Revenue Officer review and title verification for identified land discrepancies.');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState<boolean>(false);
  const [submissionSuccessToast, setSubmissionSuccessToast] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<string | null>(null);

  // Load available documents
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoadingDocs(true);
      setError(null);
      try {
        const docs = await api.getDocuments();
        setDocuments(docs);

        // Check if doc_ids provided in URL search params
        const urlDocIds = searchParams.get('doc_ids');
        if (urlDocIds) {
          const ids = urlDocIds.split(',').map(Number).filter((id) => !isNaN(id) && id > 0);
          if (ids.length >= 2) {
            setSelectedDocIds(ids);
            executeReconciliation(ids);
            return;
          }
        }

        // Default: Auto-select Triad if available (Sale Deed, Mutation, 7/12 Extract)
        const saleDoc = docs.find((d) => d.document_type?.code === 'SALE_DEED') || docs.find((d) => d.file_name.toLowerCase().includes('sale'));
        const mutDoc = docs.find((d) => d.document_type?.code === 'MUTATION_RECORD') || docs.find((d) => d.file_name.toLowerCase().includes('ferfar'));
        const rorDoc = docs.find((d) => d.document_type?.code === '7_12_EXTRACT') || docs.find((d) => d.file_name.toLowerCase().includes('7_12'));

        if (saleDoc && mutDoc && rorDoc) {
          const triadIds = [saleDoc.id, mutDoc.id, rorDoc.id];
          setSelectedDocIds(triadIds);
          executeReconciliation(triadIds);
        } else if (docs.length >= 2) {
          const firstTwo = docs.slice(0, 3).map((d) => d.id);
          setSelectedDocIds(firstTwo);
          executeReconciliation(firstTwo);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch document repository';
        setError(msg);
      } finally {
        setIsLoadingDocs(false);
      }
    };

    loadDocuments();
  }, []);

  const executeReconciliation = async (docIds: number[]) => {
    if (docIds.length < 2) {
      setError('Please select at least 2 documents to perform cross-record reconciliation.');
      return;
    }
    setIsRunning(true);
    setError(null);
    try {
      const response = await api.runReconciliation(docIds);
      setReconciliationData(response);
      setCaseStatus(response.status);
      setSearchParams({ doc_ids: docIds.join(',') });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reconciliation execution failed';
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!reconciliationData?.case_id) return;
    setIsSubmittingVerification(true);
    try {
      const res = await api.submitCitizenVerification(reconciliationData.case_id, citizenMessage);
      setCaseStatus(res.status);
      setShowSubmitModal(false);
      setSubmissionSuccessToast(res.message);
      setTimeout(() => setSubmissionSuccessToast(null), 6000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to submit verification request');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handleToggleDoc = (docId: number) => {
    setSelectedDocIds((prev) => {
      const next = prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId];
      return next;
    });
  };

  const handleSelectTriad = () => {
    const saleDoc = documents.find((d) => d.document_type?.code === 'SALE_DEED') || documents.find((d) => d.file_name.toLowerCase().includes('sale'));
    const mutDoc = documents.find((d) => d.document_type?.code === 'MUTATION_RECORD') || documents.find((d) => d.file_name.toLowerCase().includes('ferfar'));
    const rorDoc = documents.find((d) => d.document_type?.code === '7_12_EXTRACT') || documents.find((d) => d.file_name.toLowerCase().includes('7_12'));

    const triad = [saleDoc?.id, mutDoc?.id, rorDoc?.id].filter(Boolean) as number[];
    if (triad.length >= 2) {
      setSelectedDocIds(triad);
      executeReconciliation(triad);
    } else {
      alert('Could not find complete Triad records in your uploaded documents.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXACT_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exact Match</span>
          </span>
        );
      case 'LIKELY_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>Likely Match</span>
          </span>
        );
      case 'MINOR_DIFFERENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Minor Difference</span>
          </span>
        );
      case 'CONFLICT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Conflict</span>
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Needs Review</span>
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span>Missing</span>
          </span>
        );
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>High Discrepancy Risk</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Moderate Variance</span>
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Consistent Title Chain</span>
          </span>
        );
    }
  };

  const filteredFields = reconciliationData?.fields.filter((f) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'conflicts') return f.status === 'CONFLICT';
    if (selectedCategory === 'matches') return f.status === 'EXACT_MATCH' || f.status === 'LIKELY_MATCH';
    return f.category === selectedCategory;
  }) || [];

  return (
    <PortalLayout
      portalType="citizen"
      title="Document Reconciliation"
      subtitle="Automated cadastral entity normalization and field-level cross-document reconciliation."
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Verification Submission Success Toast */}
        {submissionSuccessToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{submissionSuccessToast}</span>
            </div>
            <button onClick={() => setSubmissionSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3 Guided Journey Banner for Rural Citizens */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-700">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                STEP 3 OF 3
              </span>
              <span>Cross-Record Consistency & Title Verification</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Automatic Dispute & Discrepancy Detection
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            BhoomiAI compares your registered Sale Deed, Mutation Ferfar, and 7/12 Extract side-by-side to ensure recorded areas, owner names, and survey numbers match without discrepancies.
          </p>
        </div>

        {/* Document Selector Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Select Documents for Triad Reconciliation</span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose 2 or more related records (Sale Deed, Mutation Record, 7/12 Extract) to cross-validate.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectTriad}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Triad (Deed + Mutation + 7/12)</span>
              </button>

              <button
                type="button"
                onClick={() => executeReconciliation(selectedDocIds)}
                disabled={isRunning || selectedDocIds.length < 2}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition ${
                  isRunning || selectedDocIds.length < 2
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>{isRunning ? 'Reconciling Fields...' : 'Run Reconciliation'}</span>
              </button>
            </div>
          </div>

          {/* Document Pills with Checkboxes */}
          {isLoadingDocs ? (
            <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading document catalog...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleDoc(doc.id)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-900 truncate">
                          {doc.document_type?.name || 'Document'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-white border border-slate-200 text-slate-600">
                          {doc.language}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {doc.file_name}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Main Comparison Section */}
        {reconciliationData && (
          <div className="space-y-6">
            
            {/* Plain-Language Status Card for Rural Citizens */}
            {reconciliationData.summary_stats.conflicts === 0 ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-950">
                      All Land Records Match • सुरक्षित (Title is Consistent)
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    No ownership chain breaks or recorded area discrepancies were found between your Sale Deed, Mutation Ferfar, and 7/12 Extract.
                  </p>
                </div>
                <Link
                  to="/citizen/land"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition shadow-xs shrink-0"
                >
                  <span>View on Cadastral Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-amber-50 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-950">
                      Discrepancies Detected • तपासणी आवश्यक ({reconciliationData.summary_stats.conflicts} differences found)
                    </span>
                  </div>
                  <p className="text-xs text-amber-900">
                    Differences were detected in recorded areas or owner name spellings across your documents. You can inspect the source pages or request official verification from the Revenue Officer below.
                  </p>
                </div>
                {caseStatus !== 'PENDING_AUTHORITY_REVIEW' && caseStatus !== 'UNDER_VERIFICATION' && (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition shadow-xs shrink-0"
                  >
                    <span>Submit to Revenue Officer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Header Metrics & Risk Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      DOCUMENTS COMPARED: {reconciliationData.documents_count}
                    </span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-mono text-slate-600">
                      Case: <strong>{reconciliationData.case_number}</strong>
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Cadastral Triad Reconciliation Report
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  {getRiskLevelBadge(reconciliationData.risk_level)}
                </div>
              </div>

              {/* Documents Compared Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600 mr-1">Sources Ingested:</span>
                {reconciliationData.documents.map((d) => (
                  <div
                    key={d.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-800">{d.document_type_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({d.file_name})</span>
                  </div>
                ))}
              </div>

              {/* Statistical Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-medium">Total Fields</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {reconciliationData.summary_stats.total_fields}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-xs text-emerald-700 font-medium">Exact Matches</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1 flex items-center justify-center gap-1">
                    <span>{reconciliationData.summary_stats.exact_matches}</span>
                    <span className="text-xs">✓</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                  <div className="text-xs text-blue-700 font-medium">Likely Matches</div>
                  <div className="text-xl font-extrabold text-blue-800 mt-1">
                    {reconciliationData.summary_stats.likely_matches}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                  <div className="text-xs text-amber-700 font-medium">Minor Diff</div>
                  <div className="text-xl font-extrabold text-amber-800 mt-1">
                    {reconciliationData.summary_stats.minor_differences}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border text-center ${
                  reconciliationData.summary_stats.conflicts > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className={`text-xs font-semibold ${reconciliationData.summary_stats.conflicts > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    Conflicts
                  </div>
                  <div className={`text-xl font-extrabold mt-1 ${reconciliationData.summary_stats.conflicts > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                    {reconciliationData.summary_stats.conflicts} ⚠️
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 font-medium">Missing / N/A</div>
                  <div className="text-xl font-extrabold text-slate-600 mt-1">
                    {reconciliationData.summary_stats.missing + reconciliationData.summary_stats.needs_review}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Conflicts Advisory Banner */}
            {reconciliationData.conflicts.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cadastral Inconsistency Advisory</span>
                </div>
                <div className="text-xs text-slate-800 space-y-1 leading-relaxed">
                  {reconciliationData.conflicts.map((c) => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-rose-700 uppercase shrink-0">[{c.field_name.replace('_', ' ')}]:</span>
                        <span>{c.explanation}</span>
                      </div>
                      <Link
                        to={`/citizen/evidence?case_id=${reconciliationData.case_number}&field=${c.field_name}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-xs transition shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect in Evidence Viewer</span>
                      </Link>
                    </div>
                  ))}

                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Note: Automated checks flag potential variances across source registers. Verification requires authorized revenue official assessment.
                </p>
              </div>
            )}

            {/* Field Filters & 17-Field Comparison Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Cadastral Fields Comparison Grid (17 Core Entities)
                  </h3>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  {[
                    { key: 'all', label: 'All Fields' },
                    { key: 'conflicts', label: 'Conflicts Only' },
                    { key: 'matches', label: 'Matches Only' },
                    { key: 'party', label: 'Parties & Title' },
                    { key: 'cadastral', label: 'Cadastral Numbers' },
                    { key: 'measurement', label: 'Area' },
                    { key: 'location', label: 'Jurisdiction' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedCategory(tab.key)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        selectedCategory === tab.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-48">Cadastral Field</th>
                      <th className="py-3 px-4 w-36">Match State</th>
                      {reconciliationData.documents.map((doc) => (
                        <th key={doc.id} className="py-3 px-4 font-mono font-medium">
                          {doc.document_type_name}
                        </th>
                      ))}
                      <th className="py-3 px-4 w-32 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredFields.map((field) => {
                      const isConflict = field.status === 'CONFLICT';
                      return (
                        <tr
                          key={field.field_key}
                          className={`hover:bg-slate-50/80 transition ${
                            isConflict ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          {/* Field Label */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{field.field_label}</span>
                              {isConflict && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {field.category}
                            </span>
                          </td>

                          {/* Match State Badge */}
                          <td className="py-3.5 px-4">
                            {getStatusBadge(field.status)}
                          </td>

                          {/* Values per Document */}
                          {field.doc_values.map((v) => (
                            <td key={v.doc_id} className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                              {v.raw_value ? (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-slate-900 block truncate">
                                    {v.normalized_value || v.raw_value}
                                  </span>
                                  {v.raw_value !== v.normalized_value && (
                                    <span className="text-[10px] text-slate-400 block truncate font-mono">
                                      Raw: {v.raw_value}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Not Recorded</span>
                              )}
                            </td>
                          ))}

                          {/* Inspect Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setActiveField(field)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Citizen Submission Toast */}
            {submissionSuccessToast && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{submissionSuccessToast}</span>
                </div>
                <button onClick={() => setSubmissionSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Real Citizen ↔ Authority Verification Submission & Live Status Flow */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${
                  caseStatus === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : caseStatus === 'REJECTED'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : caseStatus === 'NEEDS_CITIZEN_INPUT'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}>
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">
                      Authority Adjudication Status:
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      caseStatus === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : caseStatus === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : caseStatus === 'NEEDS_CITIZEN_INPUT'
                        ? 'bg-amber-100 text-amber-900'
                        : caseStatus === 'PENDING_AUTHORITY_REVIEW' || caseStatus === 'UNDER_VERIFICATION'
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {(caseStatus || reconciliationData.status).replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {caseStatus === 'APPROVED'
                      ? 'Revenue Officer has approved and certified title concordance for this record.'
                      : caseStatus === 'NEEDS_CITIZEN_INPUT'
                      ? 'Officer requested clarification or supplementary documentation.'
                      : caseStatus === 'PENDING_AUTHORITY_REVIEW'
                      ? 'Your verification ticket is currently queued on the Tehsildar Workbench.'
                      : 'Flagged discrepancies are ready for formal Revenue Officer verification.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {caseStatus !== 'APPROVED' && caseStatus !== 'PENDING_AUTHORITY_REVIEW' && caseStatus !== 'UNDER_VERIFICATION' ? (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                  >
                    <span>Submit for Authority Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to={`/authority/cases/${reconciliationData.case_number}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 shadow-sm transition"
                  >
                    <span>View in Authority Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Citizen Submit Modal */}
            {showSubmitModal && (
              <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden space-y-0">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Submit to Revenue Authority
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-3 text-xs">
                    <p className="text-slate-600 leading-relaxed">
                      Formal submission sends Case <strong className="font-mono text-slate-900">{reconciliationData.case_number}</strong> directly into the Tehsildar Adjudication Queue for official scrutiny.
                    </p>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-800">
                        Applicant Message / Clarification Note:
                      </label>
                      <textarea
                        rows={3}
                        value={citizenMessage}
                        onChange={(e) => setCitizenMessage(e.target.value)}
                        placeholder="State your reason for verification..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                      />
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitVerification}
                      disabled={isSubmittingVerification}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                    >
                      {isSubmittingVerification ? 'Submitting...' : 'Confirm Submission'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Detailed Inspector Modal / Side Drawer */}
        {activeField && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden space-y-0">
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <GitCompare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeField.field_label} — Cadastral Evidence
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cross-document entity scrutiny and reconciliation breakdown.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveField(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
                
                {/* Status & Explanation Box */}
                <div className="p-4 rounded-xl border space-y-2 bg-slate-50/80 border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Reconciliation Assessment:</span>
                      {getStatusBadge(activeField.status)}
                    </div>
                    {activeField.severity !== 'NONE' && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                        Severity: {activeField.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {activeField.explanation}
                  </p>
                </div>

                {/* Dedicated Area Comparison Table (if area field) */}
                {activeField.area_comparison && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-blue-600" />
                        <span>Area Conversion & Tolerance Scrutiny (8 Standard Units)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Tolerance: ±{activeField.area_comparison.tolerance_pct}%
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Document</th>
                            <th className="py-2.5 px-3">Original Entry</th>
                            <th className="py-2.5 px-3">Normalized (Ha)</th>
                            <th className="py-2.5 px-3">Sq. Meters</th>
                            <th className="py-2.5 px-3">Variance (%)</th>
                            <th className="py-2.5 px-3">Tolerance Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeField.area_comparison.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {item.doc_title}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700">
                                {item.original}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-blue-700">
                                {item.normalized_hectares.toFixed(4)} Ha
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600">
                                {item.normalized_sq_meters.toLocaleString()} m²
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                                {item.difference_pct.toFixed(2)}%
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === 'EXACT_MATCH' || item.status === 'APPROXIMATE_MATCH'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'MINOR_DIFFERENCE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {item.status.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Per-Document Breakdown Cards */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">
                    Recorded Values Across Ingested Deeds:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeField.doc_values.map((v) => (
                      <div
                        key={v.doc_id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                      >
                        <div className="flex items-center justify-between text-slate-500 font-medium">
                          <span>{v.doc_type_name}</span>
                          <span className="text-[10px] font-mono">#{v.doc_id}</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Normalized Value:
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            {v.normalized_value || <span className="text-slate-400 italic">Not Recorded</span>}
                          </div>
                        </div>
                        {v.raw_value && v.raw_value !== v.normalized_value && (
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">
                              Original OCR Text:
                            </div>
                            <div className="text-xs text-slate-600 font-mono truncate">
                              {v.raw_value}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution & Officer Recommendation */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Reconciliation Guidance</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {activeField.status === 'CONFLICT'
                      ? 'Potential inconsistency detected. Manual verification recommended by the competent Sub-Registrar / Talathi office before mutation certification.'
                      : 'Field data is verified or consistent across the provided land record documents.'}
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveField(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  Close Inspection
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/citizen/evidence?case_id=${reconciliationData?.case_number || 'CASE-MH-2026-001'}&field=${activeField.field_key}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open in Evidence Viewer</span>
                  </Link>

                  <Link
                    to="/authority/cases"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                  >
                    <span>Authority Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>


            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
};

export default CitizenAnalysis;
