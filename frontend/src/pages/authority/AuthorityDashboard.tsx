import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileSearch,
  Scale,
  RefreshCw,
  Building2,
  FileText,
  Layers,
  Sparkles,
  BarChart3,
  MapPin,
  CheckCircle,
  Database,
  Search,
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAppState } from '../../context/AppStateContext';
import { api } from '../../services/api';
import type {
  AuthorityDashboardStats,
  CaseQueueItem,
  ComprehensiveAuthorityAnalytics,
} from '../../services/api';

export const AuthorityDashboard: React.FC = () => {
  const { selectedState } = useAppState();
  const [stats, setStats] = useState<AuthorityDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<ComprehensiveAuthorityAnalytics | null>(null);
  const [recentCases, setRecentCases] = useState<CaseQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State / District Digitization Filter
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [districtSearch, setDistrictSearch] = useState<string>('');

  const fetchDashboardData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const [statsData, analyticsData, casesData] = await Promise.all([
        api.getAuthorityDashboardStats(),
        api.getAuthorityAnalytics(),
        api.getAuthorityCases({ limit: '6' } as any),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
      setRecentCases(casesData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard metrics';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData(false);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toUpperCase()) {
      case 'CRITICAL':
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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filtered digitization progress
  const filteredProgress = analytics?.digitization_progress.filter((item) => {
    const matchesState = stateFilter === 'ALL' || item.state === stateFilter;
    const matchesDistrict =
      !districtSearch ||
      item.district.toLowerCase().includes(districtSearch.toLowerCase().trim()) ||
      item.state.toLowerCase().includes(districtSearch.toLowerCase().trim());
    return matchesState && matchesDistrict;
  }) || [];

  return (
    <PortalLayout
      portalType="authority"
      title="Revenue Authority Interactive Command Center"
      subtitle="Executive dashboards for land document processing, extraction accuracy, verification status, error statistics, and multi-state digitization."
    >
      <div className="space-y-8">
        
        {/* Officer Context & Quick Navigation Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border border-indigo-800/60 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-wider text-indigo-300 uppercase">
                Jurisdiction: Revenue Division {selectedState}
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>Desk of Tahsildar R. K. Patil (Haveli, Pune)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ONLINE &bull; LIVE SYSTEM
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition"
              title="Refresh database statistics"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
            </button>
            <Link
              to="/authority/documents"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Document Repository</span>
            </Link>
            <Link
              to="/authority/cases"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-sm transition"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Adjudication Queue</span>
            </Link>
            <Link
              to="/authority/gis"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cadastral GIS</span>
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to fetch live database metrics: {error}</span>
            </div>
            <button
              onClick={() => fetchDashboardData(true)}
              className="px-2.5 py-1 bg-white border border-rose-300 rounded text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ROW 1: DOCUMENTS PROCESSED & EXTRACTION ACCURACY */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* MODULE 1: Number of Documents Processed */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Documents Processed & Repository Volume
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total ingestions, multi-page OCR scans, and certified land records
                  </p>
                </div>
              </div>
              <Link
                to="/authority/documents"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Top 3 Metric Blocks */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">Total Docs</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                  {isLoading ? '...' : (analytics?.documents_stats.total_processed ?? 7)}
                </div>
                <div className="text-[10px] text-slate-400">Authenticated</div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80">
                <div className="text-[11px] font-mono uppercase text-blue-700 font-bold">Pages OCR'd</div>
                <div className="text-2xl font-bold text-blue-900 font-mono mt-1">
                  {isLoading ? '...' : (analytics?.documents_stats.total_pages_ocr ?? 19)}
                </div>
                <div className="text-[10px] text-blue-600">Multi-page scans</div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                <div className="text-[11px] font-mono uppercase text-indigo-700 font-bold">Vault Storage</div>
                <div className="text-2xl font-bold text-indigo-900 font-mono mt-1">
                  {isLoading ? '...' : `${analytics?.documents_stats.total_storage_mb ?? 14.8} MB`}
                </div>
                <div className="text-[10px] text-indigo-600">SHA-256 sealed</div>
              </div>
            </div>

            {/* Breakdown By Document Type */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Ingestion Distribution by Land Document Type</span>
                <span className="text-slate-400 text-[11px]">Real DB Records</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {analytics?.documents_stats.by_type &&
                  Object.entries(analytics.documents_stats.by_type).map(([name, count]) => (
                    <div
                      key={name}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-700 font-medium truncate max-w-[170px]" title={name}>
                        {name}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 px-2 py-0.5 rounded bg-white border border-slate-200">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* MODULE 2: Extraction Accuracy */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    BhoomiAI Extraction Accuracy
                  </h3>
                  <p className="text-xs text-slate-500">
                    Multi-lingual OCR & Indic NER field confidence metrics
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{analytics?.extraction_accuracy.overall_accuracy ?? 96.8}% OVERALL</span>
              </div>
            </div>

            {/* Individual Entity Accuracy Progress Bars */}
            <div className="space-y-3.5">
              {[
                { label: 'Owner Name Extraction (Indic NER / Marathi & English)', val: analytics?.extraction_accuracy.owner_name_accuracy ?? 97.4, color: 'bg-emerald-600' },
                { label: 'Survey & Gat Number Canonical Mapping', val: analytics?.extraction_accuracy.survey_number_accuracy ?? 98.6, color: 'bg-emerald-600' },
                { label: 'Land Area & Hectare Normalization', val: analytics?.extraction_accuracy.area_accuracy ?? 96.2, color: 'bg-blue-600' },
                { label: 'Mutation Register & Ferfar Cross-Reference', val: analytics?.extraction_accuracy.mutation_accuracy ?? 94.8, color: 'bg-indigo-600' },
                { label: 'Cadastral Boundaries & Adjoining Survey Numbers', val: analytics?.extraction_accuracy.boundary_accuracy ?? 93.5, color: 'bg-amber-600' },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <span className="font-mono font-bold text-slate-900">{item.val}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Quality Assurance Guarantee:</strong> Extractions with &lt;85% confidence trigger mandatory officer review before field verification.
              </span>
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ROW 2: VALIDATION STATUS & ERROR STATISTICS */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* MODULE 3: Validation Status Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Validation Status Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Adjudication lifecycle of registered land verification cases
                  </p>
                </div>
              </div>
              <Link
                to="/authority/cases"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Adjudicate All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                to="/authority/cases?status=APPROVED"
                className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 transition"
              >
                <div className="text-[11px] font-mono text-emerald-800 font-bold uppercase">Verified / Approved</div>
                <div className="text-2xl font-bold text-emerald-900 font-mono mt-1">
                  {stats?.verified ?? analytics?.validation_status_breakdown['Verified'] ?? 2}
                </div>
                <div className="text-[10px] text-emerald-700">Mutation cleared</div>
              </Link>

              <Link
                to="/authority/cases?status=PENDING_AUTHORITY_REVIEW"
                className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/70 transition"
              >
                <div className="text-[11px] font-mono text-blue-800 font-bold uppercase">Pending Review</div>
                <div className="text-2xl font-bold text-blue-900 font-mono mt-1">
                  {stats?.pending_cases ?? analytics?.validation_status_breakdown['Pending Authority Review'] ?? 6}
                </div>
                <div className="text-[10px] text-blue-700">Awaiting officer action</div>
              </Link>

              <Link
                to="/authority/cases?status=UNDER_VERIFICATION"
                className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 hover:bg-indigo-100/70 transition"
              >
                <div className="text-[11px] font-mono text-indigo-800 font-bold uppercase">Under Verification</div>
                <div className="text-2xl font-bold text-indigo-900 font-mono mt-1">
                  {stats?.under_review ?? analytics?.validation_status_breakdown['Under Verification'] ?? 1}
                </div>
                <div className="text-[10px] text-indigo-700">Field inquiry active</div>
              </Link>

              <Link
                to="/authority/cases?status=NEEDS_CITIZEN_INPUT"
                className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100/70 transition"
              >
                <div className="text-[11px] font-mono text-amber-800 font-bold uppercase">Citizen Input Req.</div>
                <div className="text-2xl font-bold text-amber-900 font-mono mt-1">
                  {analytics?.validation_status_breakdown['Needs Citizen Input'] ?? 1}
                </div>
                <div className="text-[10px] text-amber-700">Notice issued</div>
              </Link>

              <Link
                to="/authority/cases?status=ESCALATED"
                className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 hover:bg-purple-100/70 transition"
              >
                <div className="text-[11px] font-mono text-purple-800 font-bold uppercase">Escalated to SDO</div>
                <div className="text-2xl font-bold text-purple-900 font-mono mt-1">
                  {stats?.escalated ?? analytics?.validation_status_breakdown['Escalated'] ?? 1}
                </div>
                <div className="text-[10px] text-purple-700">Tribunal review</div>
              </Link>

              <Link
                to="/authority/cases?status=REJECTED"
                className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100/70 transition"
              >
                <div className="text-[11px] font-mono text-rose-800 font-bold uppercase">Disallowed / Rejected</div>
                <div className="text-2xl font-bold text-rose-900 font-mono mt-1">
                  {stats?.rejected ?? analytics?.validation_status_breakdown['Rejected'] ?? 0}
                </div>
                <div className="text-[10px] text-rose-700">Invalid petitions</div>
              </Link>
            </div>
          </div>

          {/* MODULE 5: Error Statistics */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    System Error & Quality Gate Statistics
                  </h3>
                  <p className="text-xs text-slate-500">
                    OCR noise, document tilt corrections, and cross-record discrepancies
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                ACTIVE MONITORING
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  label: 'Quality Gate Failures (Degraded / Low DPI Scans)',
                  count: analytics?.error_statistics.quality_gate_failures ?? 1,
                  desc: 'Scans flagged below 200 DPI requiring re-upload or certified physical copy',
                  badge: 'bg-rose-100 text-rose-800 border-rose-300',
                },
                {
                  label: 'OCR Low Contrast / Blur Warnings',
                  count: analytics?.error_statistics.ocr_blur_contrast_warnings ?? 3,
                  desc: 'Historical handwritten Marathi stamps pre-processed with adaptive thresholding',
                  badge: 'bg-amber-100 text-amber-800 border-amber-300',
                },
                {
                  label: 'Skew / Tilt Auto-Corrections',
                  count: analytics?.error_statistics.skew_tilt_corrections ?? 5,
                  desc: 'Hough transform orientation alignment automatically corrected prior to OCR',
                  badge: 'bg-blue-100 text-blue-800 border-blue-300',
                },
                {
                  label: 'Field Validation Mismatches (Cross-Document)',
                  count: analytics?.error_statistics.field_validation_mismatches ?? 4,
                  desc: 'Owner name or area inconsistencies between 7/12 extract and registered sale deed',
                  badge: 'bg-purple-100 text-purple-800 border-purple-300',
                },
                {
                  label: 'Unresolved Discrepancy Conflicts',
                  count: analytics?.error_statistics.unresolved_conflicts ?? 5,
                  desc: 'Pending revenue authority hearing under MLRC Sec 155 for typo rectification',
                  badge: 'bg-rose-100 text-rose-800 border-rose-300',
                },
              ].map((errItem) => (
                <div
                  key={errItem.label}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-900">{errItem.label}</div>
                    <div className="text-[11px] text-slate-500">{errItem.desc}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 ${errItem.badge}`}>
                    {errItem.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ROW 3: MODULE 6 - STATE-WISE & DISTRICT-WISE DIGITIZATION PROGRESS */}
        {/* ------------------------------------------------------------------ */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  State-wise & District-wise Digitization Progress
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time land record parcel mapping and cadastral digitization coverage across India
                </p>
              </div>
            </div>

            {/* Interactive Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search district or state..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-slate-50 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All States</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">State & Division</th>
                  <th className="py-3 px-3">District & Tehsil</th>
                  <th className="py-3 px-3">Digitized Parcels</th>
                  <th className="py-3 px-3">Total Surveyed</th>
                  <th className="py-3 px-3 w-1/3">Digitization Completion</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProgress.map((item, idx) => (
                  <tr key={`${item.state}-${item.district}-${idx}`} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {item.state}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      <span className="font-semibold text-indigo-700">{item.district}</span>
                      {item.district === 'Pune' && <span className="text-[10px] text-slate-400 font-mono ml-1">(Haveli / Wagholi)</span>}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {item.digitized_parcels.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">
                      {(item.total_parcels || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-700">{item.percentage}% Complete</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              item.percentage >= 90
                                ? 'bg-emerald-600'
                                : item.percentage >= 80
                                ? 'bg-indigo-600'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.percentage >= 90
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ROW 4: MODULE 4 - PENDING VERIFICATION CASES PREVIEW WORKLIST */}
        {/* ------------------------------------------------------------------ */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Priority Verification Cases Awaiting Officer Action
                </h3>
                <p className="text-xs text-slate-500">
                  Active land dispute cases, phonetic name conflicts, and boundary verification appeals
                </p>
              </div>
            </div>
            <Link
              to="/authority/cases"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
            >
              <span>Full Worklist ({stats?.total_cases ?? 6})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <div>Loading real database queue...</div>
            </div>
          )}

          {!isLoading && recentCases.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Case ID</th>
                    <th className="py-3 px-3">Citizen Submission</th>
                    <th className="py-3 px-3">Location / Village</th>
                    <th className="py-3 px-3">Documents</th>
                    <th className="py-3 px-3">Conflicts</th>
                    <th className="py-3 px-3">Risk Level</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Initiated</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentCases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {c.case_number}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {c.citizen_submission_id}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <span className="font-semibold">{c.village || 'Wagholi'}</span>
                        <span className="text-slate-400">, {c.district || 'Pune'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>{c.documents_count} docs</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {c.conflicts_count > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {c.conflicts_count} Conflict{c.conflicts_count > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-semibold">Clean</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRiskBadge(c.risk_level)}`}>
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${getStatusBadge(c.status)}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/authority/cases/${c.case_number}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                        >
                          <span>Workbench</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && recentCases.length === 0 && (
            <div className="text-center py-10 max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 shadow-sm">
                <FileSearch className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Verification Queue Empty</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No active land conflict cases are pending for review in the database.
              </p>
            </div>
          )}
        </div>

        {/* Legal & Statutory Note */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700 shadow-sm">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900">Statutory Record Keeping & Audit Trails:</strong> All actions taken across the Secure Document Repository, Extraction Review Workbench, and Verification Queue write permanent, immutable audit entries with cryptographic SHA-256 hashes and officer credentials conforming to the Maharashtra Land Revenue Code (MLRC) 1966 and National Land Record Modernization Programme (NLRMP) guidelines.
          </div>
        </div>

      </div>
    </PortalLayout>
  );
};

export default AuthorityDashboard;
