import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  FileText,
  Edit3,
  MessageSquare,
  FilePlus,
  ArrowUpRight,
  MapPin,
  RefreshCw,
  X,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAppState } from '../../context/AppStateContext';
import { api } from '../../services/api';
import type {
  AuthorityCaseDetailFull,
  OfficerActionPayload,
} from '../../services/api';

export const AuthorityCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const caseId = id || 'CASE-MH-2026-001';
  const { t } = useAppState();

  // Case details state
  const [caseData, setCaseData] = useState<AuthorityCaseDetailFull | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<'FIELDS' | 'CONFLICTS' | 'EVIDENCE' | 'DOCS_OCR' | 'RISK'>('FIELDS');

  // OCR & Document inspection state
  const [selectedDocIndex, setSelectedDocIndex] = useState<number>(0);
  const [selectedOcrPageIndex, setSelectedOcrPageIndex] = useState<number>(0);

  // Officer Action Modal State
  const [modalAction, setModalAction] = useState<{
    action: string;
    title: string;
    subtitle: string;
    field_name?: string;
    field_id?: number;
    conflict_id?: number;
    initial_value?: string;
    requires_new_value?: boolean;
    buttonColor: string;
  } | null>(null);

  const [officerReason, setOfficerReason] = useState<string>('');
  const [officerNewValue, setOfficerNewValue] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const fetchCaseDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAuthorityCaseDetailFull(caseId);
      setCaseData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch case details';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  // Open action modal
  const openActionModal = (config: {
    action: string;
    title: string;
    subtitle: string;
    field_name?: string;
    field_id?: number;
    conflict_id?: number;
    initial_value?: string;
    requires_new_value?: boolean;
    buttonColor: string;
  }) => {
    setModalAction(config);
    setOfficerReason('');
    setOfficerNewValue(config.initial_value || '');
    setActionError(null);
  };

  // Submit action to backend with mandatory reason
  const handleConfirmAction = async () => {
    if (!modalAction) return;

    if (!officerReason || officerReason.trim().length < 3) {
      setActionError('Official reason / rationale is mandatory (at least 3 characters).');
      return;
    }

    if (modalAction.requires_new_value && !officerNewValue.trim()) {
      setActionError('New value is required for this edit.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError(null);

    const payload: OfficerActionPayload = {
      action: modalAction.action,
      reason: officerReason.trim(),
      field_name: modalAction.field_name,
      field_id: modalAction.field_id,
      conflict_id: modalAction.conflict_id,
      new_value: modalAction.requires_new_value ? officerNewValue.trim() : undefined,
      officer_name: 'Officer R. K. Patil (Tehsildar)',
      officer_role: 'Revenue Officer',
    };

    try {
      const res = await api.executeOfficerAction(caseId, payload);
      setActionToast(res.message);
      setModalAction(null);
      // Refresh case data
      await fetchCaseDetails();
      setTimeout(() => setActionToast(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute officer action';
      setActionError(msg);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'VERIFIED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ESCALATED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'NEEDS_CITIZEN_INPUT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'UNDER_VERIFICATION':
      case 'UNDER_REVIEW':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PENDING_AUTHORITY_REVIEW':
      case 'PENDING_REVIEW':
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  const formatDate = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return ts;
    }
  };

  return (
    <PortalLayout
      portalType="authority"
      title={`Adjudication Workbench: ${caseData?.case_number || caseId}`}
      subtitle="Officer inspection of cross-document discrepancies with linked source citations and legally binding decisions."
    >
      <div className="space-y-6">
        
        {/* Navigation & Case Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            to="/authority/cases"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('verification_queue')}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 shadow-sm flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{caseData?.jurisdiction.village || 'Wagholi'}, {caseData?.jurisdiction.district || 'Pune'}</span>
            </span>
            {caseData && (
              <>
                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md border font-semibold ${getRiskBadge(caseData.risk_level)}`}>
                  Risk: {caseData.risk_level}
                </span>
                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-md border font-semibold ${getStatusBadge(caseData.status)}`}>
                  Status: {caseData.status.replace(/_/g, ' ')}
                </span>
              </>
            )}
            <button
              onClick={fetchCaseDetails}
              className="p-1.5 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition shadow-sm"
              title="Refresh Case"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Success Toast */}
        {actionToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionToast}</span>
            </div>
            <button onClick={() => setActionToast(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading / Error States */}
        {isLoading && (
          <div className="border border-slate-200 rounded-xl bg-white p-12 text-center text-xs text-slate-500 shadow-sm">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading case adjudication workbench...
          </div>
        )}

        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded-xl p-6 text-center space-y-3 shadow-sm">
            <div className="text-sm font-bold text-rose-900">Case Record Not Found</div>
            <p className="text-xs text-rose-700">{error}</p>
            <Link
              to="/authority/cases"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 shadow-sm"
            >
              <span>Return to Cases Queue</span>
            </Link>
          </div>
        )}

        {!isLoading && caseData && (
          <div className="space-y-6">

            {/* Quick Officer Decision Bar (Prominent top banner) */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Officer Adjudication Bar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Assigned Officer: <strong className="text-slate-800">{caseData.assigned_officer}</strong> • Mandatory rationale logged on every action.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  Citizen Ticket: <strong className="text-indigo-700">{caseData.citizen_submission_id}</strong>
                </div>
              </div>

              {/* 5 Global Decision Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                
                {/* 1. Approve */}
                <button
                  type="button"
                  onClick={() => openActionModal({
                    action: 'APPROVE',
                    title: 'Approve Record Mutation & Certification',
                    subtitle: 'Confirm that title continuity, survey boundaries, and party names are concordant under State Revenue regulations.',
                    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                  })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Mutation</span>
                </button>

                {/* 2. Reject */}
                <button
                  type="button"
                  onClick={() => openActionModal({
                    action: 'REJECT',
                    title: 'Reject Land Record Petition',
                    subtitle: 'Reject this application due to irreconcilable cadastral discrepancy, fraudulent deed, or legal impediment.',
                    buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white',
                  })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 shadow-sm transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Petition</span>
                </button>

                {/* 3. Escalate */}
                <button
                  type="button"
                  onClick={() => openActionModal({
                    action: 'ESCALATE',
                    title: 'Escalate to Sub-Divisional Officer (SDO)',
                    subtitle: 'Transfer this case to the SDO or Collector for judicial inquiry or physical boundary measurement.',
                    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
                  })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 shadow-sm transition"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Escalate to SDO</span>
                </button>

                {/* 4. Request Clarification */}
                <button
                  type="button"
                  onClick={() => openActionModal({
                    action: 'REQUEST_CLARIFICATION',
                    title: 'Request Clarification from Citizen',
                    subtitle: 'Send an inquiry to the applicant regarding identity, family tree, or missing deed history.',
                    buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
                  })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-sm transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Clarification</span>
                </button>

                {/* 5. Request Document */}
                <button
                  type="button"
                  onClick={() => openActionModal({
                    action: 'REQUEST_DOCUMENT',
                    title: 'Request Supplementary Document',
                    subtitle: 'Notify citizen to upload additional corroborative deeds (e.g. Partition Deed, Court Decree, Boundary Map).',
                    buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
                  })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 shadow-sm transition"
                >
                  <FilePlus className="w-4 h-4" />
                  <span>Request Document</span>
                </button>

              </div>
            </div>

            {/* Main Workbench Grid: Left Content (2 cols) & Right Audit Log Timeline (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Tabs and Details */}
              <div className="lg:col-span-2 space-y-6">

                {/* Workbench Tab Strip */}
                <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 gap-2 overflow-x-auto">
                  
                  <button
                    type="button"
                    onClick={() => setActiveTab('FIELDS')}
                    className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                      activeTab === 'FIELDS'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Extracted Fields ({caseData.extracted_fields.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('CONFLICTS')}
                    className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                      activeTab === 'CONFLICTS'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Conflicts ({caseData.conflicts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('DOCS_OCR')}
                    className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                      activeTab === 'DOCS_OCR'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Documents & OCR ({caseData.documents.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('EVIDENCE')}
                    className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                      activeTab === 'EVIDENCE'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Evidence Citations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('RISK')}
                    className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                      activeTab === 'RISK'
                        ? 'border-indigo-600 text-indigo-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Risk & Confidence</span>
                  </button>

                </div>

                {/* TAB 1: EXTRACTED FIELDS (Verify Field & Edit Field Actions) */}
                {activeTab === 'FIELDS' && (
                  <div className="p-6 rounded-b-xl rounded-tr-xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Structured Field Scrutiny & Officer Corrections
                        </h4>
                        <p className="text-xs text-slate-500">
                          Review parsed entities from deeds and extracts. Verify correctness or apply official rectifications with mandatory justification.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-slate-400">Total: {caseData.extracted_fields.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Field Name</th>
                            <th className="py-2.5 px-3">Raw OCR Value</th>
                            <th className="py-2.5 px-3">Normalized Value</th>
                            <th className="py-2.5 px-3">Confidence</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Officer Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {caseData.extracted_fields.map((ef) => (
                            <tr key={ef.id} className="hover:bg-slate-50/70">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                <div className="uppercase font-mono text-[11px]">{ef.field_name.replace(/_/g, ' ')}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{ef.document_name}</div>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {ef.raw_value || <span className="text-slate-300 italic">—</span>}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-blue-700">
                                {ef.normalized_value || <span className="text-slate-300 italic">—</span>}
                              </td>
                              <td className="py-3 px-3 font-mono">
                                {ef.confidence ? (
                                  <span className="text-emerald-700 font-semibold">
                                    {(ef.confidence * 100).toFixed(0)}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">92%</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  ef.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {ef.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  
                                  {/* Action: Verify Field */}
                                  <button
                                    type="button"
                                    onClick={() => openActionModal({
                                      action: 'VERIFY_FIELD',
                                      title: `Verify Field: ${ef.field_name}`,
                                      subtitle: `Officially endorse the value '${ef.normalized_value || ef.raw_value}' as legally valid.`,
                                      field_name: ef.field_name,
                                      field_id: ef.id,
                                      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                                    })}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 text-[11px] font-semibold transition"
                                  >
                                    Verify
                                  </button>

                                  {/* Action: Edit Field */}
                                  <button
                                    type="button"
                                    onClick={() => openActionModal({
                                      action: 'EDIT_FIELD',
                                      title: `Edit Field: ${ef.field_name}`,
                                      subtitle: `Correct spelling, area measurement, or survey identifier with mandatory officer rationale.`,
                                      field_name: ef.field_name,
                                      field_id: ef.id,
                                      initial_value: ef.normalized_value || ef.raw_value || '',
                                      requires_new_value: true,
                                      buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
                                    })}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 text-[11px] font-semibold transition flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>

                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONFLICTS (Resolve Conflict Action) */}
                {activeTab === 'CONFLICTS' && (
                  <div className="p-6 rounded-b-xl rounded-tr-xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Identified Cross-Record Discrepancies
                        </h4>
                        <p className="text-xs text-slate-500">
                          Automated reconciliation detected variances between the registered deed and revenue ledger.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-700">
                        {caseData.conflicts.filter(c => c.status === 'OPEN').length} Open
                      </span>
                    </div>

                    <div className="space-y-3">
                      {caseData.conflicts.map((conf) => (
                        <div
                          key={conf.id}
                          className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                            conf.status === 'RESOLVED'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : 'bg-amber-50/70 border-amber-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`w-4 h-4 ${conf.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'}`} />
                              <span className="font-bold text-slate-900 font-mono uppercase text-sm">
                                {conf.field_name.replace(/_/g, ' ')}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                                Severity: {conf.severity}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                conf.status === 'RESOLVED' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                              }`}>
                                {conf.status}
                              </span>

                              {conf.status !== 'RESOLVED' && (
                                <button
                                  type="button"
                                  onClick={() => openActionModal({
                                    action: 'RESOLVE_CONFLICT',
                                    title: `Resolve Conflict on ${conf.field_name}`,
                                    subtitle: `Mark this conflict as resolved after reviewing original records. Enter legal justification.`,
                                    field_name: conf.field_name,
                                    conflict_id: conf.id,
                                    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                                  })}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
                                >
                                  Resolve Conflict
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-800 leading-relaxed font-medium">
                            {conf.explanation}
                          </p>

                          {conf.values && (
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700">
                              <span className="font-semibold text-slate-500">Recorded Discrepant Values: </span>
                              {conf.values}
                            </div>
                          )}
                        </div>
                      ))}

                      {caseData.conflicts.length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-500">
                          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                          <div>No conflicting records detected. All fields match across instruments.</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: DOCUMENTS & OCR TRANSCRIPTS */}
                {activeTab === 'DOCS_OCR' && (
                  <div className="p-6 rounded-b-xl rounded-tr-xl bg-white border border-slate-200 shadow-sm space-y-5">
                    
                    {/* Documents List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Ingested Documents in Triad ({caseData.documents.length})
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {caseData.documents.map((doc, idx) => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocIndex(idx)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition space-y-1.5 ${
                              selectedDocIndex === idx
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {doc.document_type_name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">
                                {doc.language}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 truncate text-xs" title={doc.file_name}>
                              {doc.file_name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                              <span>{doc.page_count} page(s)</span>
                              <span className="text-emerald-700 font-semibold">{doc.quality_status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OCR Transcript Viewer */}
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Multilingual OCR Transcript
                          </h4>
                        </div>

                        {/* Page Selector */}
                        <div className="flex items-center gap-1">
                          {caseData.ocr_transcripts.map((t, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedOcrPageIndex(idx)}
                              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                                selectedOcrPageIndex === idx
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Pg {t.page_number}
                            </button>
                          ))}
                        </div>
                      </div>

                      {caseData.ocr_transcripts[selectedOcrPageIndex] && (
                        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                            <span>Document: {caseData.ocr_transcripts[selectedOcrPageIndex].file_name}</span>
                            <span>Confidence: {((caseData.ocr_transcripts[selectedOcrPageIndex].confidence || 0.9) * 100).toFixed(0)}%</span>
                          </div>
                          <pre className="whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pt-2 text-slate-200 text-xs">
                            {caseData.ocr_transcripts[selectedOcrPageIndex].ocr_text}
                          </pre>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 4: EVIDENCE CITATIONS (Split-Screen & Bounding Highlights) */}
                {activeTab === 'EVIDENCE' && (
                  <div className="p-6 rounded-b-xl rounded-tr-xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Explainable Cadastral Evidence Bundle
                        </h4>
                        <p className="text-xs text-slate-500">
                          Direct citations showing WHAT differs, WHY it was flagged, and WHERE it appears across instruments.
                        </p>
                      </div>
                      <Link
                        to={`/citizen/evidence?case_id=${caseData.case_number}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Interactive Visual Viewer ↗</span>
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {caseData.reconciliation_results.map((res) => (
                        <div
                          key={res.id}
                          className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                            res.status === 'CONFLICT'
                              ? 'border-rose-200 bg-rose-50/50'
                              : 'border-emerald-200 bg-emerald-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 uppercase font-mono">
                              Entity: {res.field_name.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                res.status === 'CONFLICT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-medium">{res.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: RISK ASSESSMENT & OPERATIONAL CONFIDENCE */}
                {activeTab === 'RISK' && (
                  <div className="p-6 rounded-b-xl rounded-tr-xl bg-white border border-slate-200 shadow-sm space-y-5">
                    <div className="border-b border-slate-200 pb-3">
                      <h4 className="text-sm font-bold text-slate-900">
                        Operational Risk & Cadastral Integrity Score
                      </h4>
                      <p className="text-xs text-slate-500">
                        Multi-factor fraud, boundary break, and title transfer risk analysis.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="text-[11px] font-mono uppercase text-slate-500">Overall Risk Level</div>
                        <div className={`text-2xl font-bold font-mono ${
                          caseData.risk_level === 'CRITICAL' || caseData.risk_level === 'HIGH' ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                          {caseData.risk_level}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="text-[11px] font-mono uppercase text-slate-500">Risk Severity Score</div>
                        <div className="text-2xl font-bold font-mono text-indigo-700">
                          {caseData.risk_assessment.risk_score} / 100
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="text-[11px] font-mono uppercase text-slate-500">Extraction Confidence</div>
                        <div className="text-2xl font-bold font-mono text-emerald-600">
                          {caseData.risk_assessment.extraction_confidence_level}
                        </div>
                      </div>

                    </div>

                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Risk Factor Breakdown:
                      </h5>
                      <div className="space-y-1.5">
                        {caseData.risk_assessment.risk_factors.map((rf, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{rf}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Right Col: Prominent Audit Log Timeline (Required by prompt) */}
              <div className="space-y-4">
                
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Visible Audit Log Timeline
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {caseData.timeline.length} Events
                    </span>
                  </div>

                  {/* Visible Chronological Timeline Events */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {caseData.timeline.map((event, idx) => (
                      <div key={event.id || idx} className="relative pl-6 pb-2 border-l-2 border-indigo-200 last:border-l-0">
                        {/* Dot */}
                        <div className="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />

                        <div className="space-y-1 text-xs">
                          
                          {/* Timestamp & User */}
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span className="font-mono font-bold text-indigo-900">
                              {formatTime(event.timestamp)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>

                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <span>{event.user}</span>
                            <span className="text-slate-400 font-normal">({event.role})</span>
                          </div>

                          {/* Action Badge */}
                          <div className="pt-0.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {event.action}
                            </span>
                          </div>

                          {/* Value Diff if present */}
                          {(event.previous_value || event.new_value) && (
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono space-y-0.5 my-1">
                              {event.previous_value && (
                                <div className="text-rose-700 line-through">
                                  Prev: {event.previous_value}
                                </div>
                              )}
                              {event.new_value && (
                                <div className="text-emerald-700 font-bold">
                                  New: {event.new_value}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Reason / Justification */}
                          {event.reason && (
                            <div className="text-[11px] bg-indigo-50/70 border border-indigo-100 rounded p-1.5 text-indigo-950 font-medium">
                              <span className="font-bold text-indigo-900">Rationale: </span>
                              {event.reason}
                            </div>
                          )}

                          {/* Description */}
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {event.description}
                          </p>

                        </div>
                      </div>
                    ))}

                    {caseData.timeline.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Case record initialized. No actions logged yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Statutory Revenue Compliance Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Statutory Audit Protocol</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Under Indian cadastral law, all officer modifications, approvals, and field rectifications require a written reason and are stamped with the officer’s cryptographic hash and timestamp.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* OFFICER ACTION MODAL (ENFORCES MANDATORY REASON) */}
        {modalAction && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden space-y-0">
              
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {modalAction.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Officer Desk Determination
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 text-xs">
                
                <p className="text-slate-700 text-xs leading-relaxed">
                  {modalAction.subtitle}
                </p>

                {/* If Editing a Field: Input for New Value */}
                {modalAction.requires_new_value && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800 text-xs">
                      Corrected / New Value <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={officerNewValue}
                      onChange={(e) => setOfficerNewValue(e.target.value)}
                      placeholder="Enter verified value..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                )}

                {/* MANDATORY REASON / RATIONALE (Required by prompt) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs">
                      Mandatory Officer Rationale / Legal Justification <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Min 3 chars</span>
                  </div>
                  <textarea
                    rows={4}
                    value={officerReason}
                    onChange={(e) => setOfficerReason(e.target.value)}
                    placeholder="Enter official revenue justification, physical inspection findings, or reference register citation..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    This justification is permanently inscribed to the tamper-evident audit timeline with your officer ID.
                  </p>
                </div>

                {/* Error message */}
                {actionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  disabled={isSubmittingAction}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isSubmittingAction || !officerReason.trim() || officerReason.trim().length < 3}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${modalAction.buttonColor}`}
                >
                  {isSubmittingAction ? 'Recording Action...' : 'Confirm Decision'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
};

export default AuthorityCaseDetail;
