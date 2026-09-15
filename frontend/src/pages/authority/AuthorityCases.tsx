import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Search,
  ArrowRight,
  Filter,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ExternalLink,
  FileCheck,
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAppState } from '../../context/AppStateContext';
import { api } from '../../services/api';
import type { CaseQueueItem, FilterOptionsResponse, AuthorityCaseDetailFull } from '../../services/api';

export const AuthorityCases: React.FC = () => {
  const { selectedState, t } = useAppState();
  const [searchParams] = useSearchParams();

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [filterState, setFilterState] = useState<string>(searchParams.get('state') || 'ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>(searchParams.get('district') || 'ALL');
  const [filterTaluka, setFilterTaluka] = useState<string>(searchParams.get('taluka') || 'ALL');
  const [filterVillage, setFilterVillage] = useState<string>(searchParams.get('village') || 'ALL');
  const [filterDocType, setFilterDocType] = useState<string>(searchParams.get('document_type') || 'ALL');
  const [filterRisk, setFilterRisk] = useState<string>(searchParams.get('risk') || 'ALL');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [filterDateFrom, setFilterDateFrom] = useState<string>(searchParams.get('date_from') || '');
  const [filterDateTo, setFilterDateTo] = useState<string>(searchParams.get('date_to') || '');

  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);

  // Cases state
  const [cases, setCases] = useState<CaseQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Document Modal state
  const [selectedCaseForDocs, setSelectedCaseForDocs] = useState<CaseQueueItem | null>(null);
  const [docModalDetails, setDocModalDetails] = useState<AuthorityCaseDetailFull | null>(null);
  const [isLoadingDocModal, setIsLoadingDocModal] = useState<boolean>(false);

  // Load filter options on mount
  useEffect(() => {
    api.getAuthorityFilterOptions()
      .then((opts) => setFilterOptions(opts))
      .catch((err) => console.warn('Could not load filter options:', err));
  }, []);

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAuthorityCases({
        state: filterState,
        district: filterDistrict,
        taluka: filterTaluka,
        village: filterVillage,
        document_type: filterDocType,
        risk: filterRisk,
        status: filterStatus,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
        search: searchTerm || undefined,
      });
      setCases(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load case queue';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filterState, filterDistrict, filterTaluka, filterVillage, filterDocType, filterRisk, filterStatus, filterDateFrom, filterDateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterState('ALL');
    setFilterDistrict('ALL');
    setFilterTaluka('ALL');
    setFilterVillage('ALL');
    setFilterDocType('ALL');
    setFilterRisk('ALL');
    setFilterStatus('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Open Document Modal for a specific case
  const openDocModal = async (c: CaseQueueItem) => {
    setSelectedCaseForDocs(c);
    setIsLoadingDocModal(true);
    try {
      const fullDetail = await api.getAuthorityCaseDetailFull(c.case_number);
      setDocModalDetails(fullDetail);
    } catch {
      setDocModalDetails(null);
    } finally {
      setIsLoadingDocModal(false);
    }
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    filterState !== 'ALL' ||
    filterDistrict !== 'ALL' ||
    filterTaluka !== 'ALL' ||
    filterVillage !== 'ALL' ||
    filterDocType !== 'ALL' ||
    filterRisk !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterDateFrom !== '' ||
    filterDateTo !== '';

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
      case 'AI_ANALYSIS_COMPLETED':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'UPLOADED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <PortalLayout
      portalType="authority"
      title={t('authority_verification_queue')}
      subtitle="Officer review and legal determination queue for flagged land record inconsistencies."
    >
      <div className="space-y-6">
        
        {/* Top Controls & Search Bar */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('search_cases')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={fetchCases}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-sm transition"
                title="Refresh Queue"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Filter Strip */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('clear_filters')}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {/* 1. State */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">State</label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_states')}</option>
                  {filterOptions?.states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* 2. District */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">District</label>
                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_districts')}</option>
                  {filterOptions?.districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* 3. Taluka */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">Taluka</label>
                <select
                  value={filterTaluka}
                  onChange={(e) => setFilterTaluka(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_talukas')}</option>
                  {filterOptions?.talukas.map((tlk) => (
                    <option key={tlk} value={tlk}>{tlk}</option>
                  ))}
                </select>
              </div>

              {/* 4. Village */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">Village</label>
                <select
                  value={filterVillage}
                  onChange={(e) => setFilterVillage(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_villages')}</option>
                  {filterOptions?.villages.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* 5. Doc Type */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">Doc Type</label>
                <select
                  value={filterDocType}
                  onChange={(e) => setFilterDocType(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_doc_types')}</option>
                  {filterOptions?.document_types.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>

              {/* 6. Risk Level */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">Risk Level</label>
                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_risks')}</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* 7. Status */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                >
                  <option value="ALL">{t('all_statuses')}</option>
                  <option value="DRAFT">Draft</option>
                  <option value="UPLOADED">Uploaded</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="AI_ANALYSIS_COMPLETED">AI Analysis Completed</option>
                  <option value="PENDING_AUTHORITY_REVIEW">Pending Authority Review</option>
                  <option value="UNDER_VERIFICATION">Under Verification</option>
                  <option value="NEEDS_CITIZEN_INPUT">Needs Citizen Input</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              {/* 8. Date Range */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-semibold mb-1">Date Filter</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full py-1 px-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-800 font-medium focus:outline-none focus:bg-white"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="border border-slate-200 rounded-xl bg-white p-12 text-center text-xs text-slate-500 shadow-sm">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading case queue from live database...
          </div>
        )}

        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded-xl p-4 text-xs text-rose-800 shadow-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchCases}
              className="px-3 py-1 bg-white border border-rose-300 rounded font-semibold text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Case Queue Table */}
        {!isLoading && cases.length > 0 && (
          <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('authority_verification_queue')} ({cases.length})
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {t('jurisdiction')}: {selectedState}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">{t('case_id')}</th>
                    <th className="py-3.5 px-4">{t('citizen_id')}</th>
                    <th className="py-3.5 px-4">{t('jurisdiction')}</th>
                    <th className="py-3.5 px-4">{t('documents')}</th>
                    <th className="py-3.5 px-4">{t('conflicts')}</th>
                    <th className="py-3.5 px-4">{t('risk')}</th>
                    <th className="py-3.5 px-4">{t('status')}</th>
                    <th className="py-3.5 px-4">{t('created')}</th>
                    <th className="py-3.5 px-4">{t('assigned_officer')}</th>
                    <th className="py-3.5 px-4 text-right">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Case ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {c.case_number}
                      </td>

                      {/* Citizen/Submission ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {c.citizen_submission_id}
                      </td>

                      {/* Jurisdiction */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold text-slate-900">{c.village || 'Wagholi'}</div>
                        <div className="text-[11px] text-slate-500">{c.taluka || 'Haveli'}, {c.district || 'Pune'}</div>
                      </td>

                      {/* Documents Section (With Interactive Doc Badges & View Modal Trigger) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => openDocModal(c)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 transition shadow-sm"
                            title="Click to preview attached documents"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>{c.documents_count} {t('documents')}</span>
                            <Eye className="w-3 h-3 ml-0.5" />
                          </button>
                          <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                            {c.document_types.map((dt, idx) => (
                              <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {dt}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Conflicts */}
                      <td className="py-3.5 px-4">
                        {c.conflicts_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{c.conflicts_count} Discrepanc{c.conflicts_count > 1 ? 'ies' : 'y'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Concordant</span>
                          </span>
                        )}
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${getRiskBadge(c.risk_level)}`}>
                          {t(c.risk_level.toUpperCase()) || c.risk_level}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(c.status)}`}>
                          {t(c.status.toUpperCase()) || c.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <div>{new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Assigned */}
                      <td className="py-3.5 px-4 text-slate-700 text-xs">
                        <div className="font-semibold text-slate-800">{c.assigned_officer}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Revenue Desk</div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDocModal(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-sm transition"
                            title={t('view_docs')}
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden xl:inline">{t('view_docs')}</span>
                          </button>
                          <Link
                            to={`/authority/cases/${c.case_number}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                          >
                            <span>Workbench</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cases.length === 0 && (
          <div className="border border-slate-200 rounded-xl bg-white p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-700 shadow-sm">
              <Inbox className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                No Cases Matched Current Filters
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {hasActiveFilters
                  ? 'Try clearing or widening your geographic, risk, or status filter criteria.'
                  : 'No cases currently registered in the database.'}
              </p>
            </div>

            {hasActiveFilters && (
              <div className="pt-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Document Viewer Modal for Verification Queue */}
        {selectedCaseForDocs && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
              
              {/* Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      {t('attached_documents')}: {selectedCaseForDocs.case_number}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Citizen Submission: {selectedCaseForDocs.citizen_submission_id} • {selectedCaseForDocs.village}, {selectedCaseForDocs.district}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCaseForDocs(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {isLoadingDocModal && (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                    <span>Loading documents for {selectedCaseForDocs.case_number}...</span>
                  </div>
                )}

                {!isLoadingDocModal && docModalDetails && docModalDetails.documents.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                      <span>Ingested Case Documents ({docModalDetails.documents.length})</span>
                      <span className="text-slate-500 font-normal text-[11px]">Click a document to inspect</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {docModalDetails.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {doc.document_type_name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-200">
                                {doc.language}
                              </span>
                            </div>
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{doc.quality_status}</span>
                            </span>
                          </div>

                          <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                            <span className="truncate max-w-[360px]" title={doc.file_name}>
                              {doc.file_name}
                            </span>
                            <span className="text-xs font-mono text-slate-500 font-normal">
                              {doc.page_count} Page(s)
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px] font-mono">
                              File ID: #{doc.id}
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/citizen/evidence?doc_id=${doc.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{t('view_in_evidence_viewer')}</span>
                              </Link>
                              <Link
                                to={`/authority/cases/${selectedCaseForDocs.case_number}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{t('inspect_ocr')}</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoadingDocModal && (!docModalDetails || docModalDetails.documents.length === 0) && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    {t('no_documents_found')}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                <Link
                  to={`/authority/cases/${selectedCaseForDocs.case_number}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                >
                  <span>Open Full Workbench</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedCaseForDocs(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm"
                >
                  {t('close')}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
};

export default AuthorityCases;
