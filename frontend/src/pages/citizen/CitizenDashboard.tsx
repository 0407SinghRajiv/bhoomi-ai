import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  GitCompare,
  ArrowRight,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Shield,
  Eye
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAppState } from '../../context/AppStateContext';
import { api } from '../../services/api';
import type { ApiReconciliationCase } from '../../services/api';

export const CitizenDashboard: React.FC = () => {
  const { selectedState, stateMetadata } = useAppState();
  const [cases, setCases] = useState<ApiReconciliationCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(true);

  useEffect(() => {
    api.getCases()
      .then((data) => setCases(data))
      .catch((err) => console.warn('Could not load citizen cases:', err))
      .finally(() => setIsLoadingCases(false));
  }, []);

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

  return (
    <PortalLayout
      portalType="citizen"
      title="Citizen Land Intelligence Workspace"
      subtitle="Analyze land records, check cross-document consistency, and track ownership continuity."
    >
      <div className="space-y-8">
        
        {/* State Banner / Context */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500">Selected Revenue Jurisdiction</div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>State of {selectedState}</span>
                <span className="text-xs font-normal text-slate-500">({stateMetadata.primaryLanguages.join(', ')})</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 sm:text-right">
            <div>Standard records: <strong className="text-slate-800">{stateMetadata.commonDocuments.slice(0, 2).join(' • ')}</strong></div>
            <div>Measurement units: <strong className="text-slate-700">{stateMetadata.landMeasurementUnits.join(', ')}</strong></div>
          </div>
        </div>

        {/* Phase 8 Cadastral GIS & Land Holdings Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Layers className="w-3.5 h-3.5" />
              <span>Phase 8 Cadastral GIS & Landowner Identity</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              My Land Holdings: Survey 124/2 & Survey 208/1
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Inspect your spatial land parcels on satellite basemaps, verify registered landowner continuity, and view authentic scanned source documents.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 z-10">
            <Link
              to="/citizen/land"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md hover:shadow-lg"
            >
              <span>Explore My Land GIS</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3-Step Guided Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-700 font-mono tracking-wider uppercase block">Step 1</span>
                <h3 className="text-base font-bold text-slate-900">Upload Land Papers</h3>
                <div className="text-[11px] font-medium text-slate-500">खरेदी खत • फेरफार • ७/१२</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your Registered Sale Deed, Mutation Record, and Record of Rights for automated OCR parsing.
              </p>
            </div>
            <Link
              to="/citizen/upload"
              className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <span>1. Upload Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-700 font-mono tracking-wider uppercase block">Step 2</span>
                <h3 className="text-base font-bold text-slate-900">My Land & GIS Map</h3>
                <div className="text-[11px] font-medium text-slate-500">गाव नकाशा • क्षेत्र • खातेदार</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect your surveyed land parcels on satellite basemaps and view official 7/12 extract details.
              </p>
            </div>
            <Link
              to="/citizen/land"
              className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition"
            >
              <span>2. View Land GIS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-700 font-mono tracking-wider uppercase block">Step 3</span>
                <h3 className="text-base font-bold text-slate-900">Check Discrepancies</h3>
                <div className="text-[11px] font-medium text-slate-500">ताळमेळ • तपासणी • खात्री</div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verify that recorded areas and owner names match across deeds, and submit to the Revenue Officer if needed.
              </p>
            </div>
            <Link
              to="/citizen/analysis"
              className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition"
            >
              <span>3. Check Consistency</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* Live Active Verification Jobs (Real Database Records) */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Active Verification Tickets & Adjudication Status
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time status flow synced directly with Revenue Authority determinations.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">Live Database Sync</span>
          </div>

          {isLoadingCases && (
            <div className="py-8 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <div>Loading active verification records...</div>
            </div>
          )}

          {!isLoadingCases && cases.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{c.case_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getRiskBadge(c.risk_level)}`}>
                        Risk: {c.risk_level}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold border ${getStatusBadge(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono">
                    <span>Submitted: {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>Updated: {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      to={`/citizen/evidence?case_id=${c.case_number}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Evidence Viewer</span>
                    </Link>

                    <Link
                      to={`/authority/cases/${c.case_number}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Authority Desk Track</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingCases && cases.length === 0 && (
            <div className="text-center py-10 max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No Ingestion Jobs Yet</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You have not uploaded any land record batches in this evaluation session. Click below to explore the document upload interface.
              </p>
              <div className="pt-2">
                <Link
                  to="/citizen/upload"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Begin Multi-Document Upload</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Statutory Legal Notice */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700 shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900">Bidirectional Citizen-Authority Flow Active:</strong> Cases submitted by citizens appear instantly in the Revenue Authority Adjudication Queue. Official rulings and modifications update this dashboard in real time.
          </div>
        </div>

      </div>
    </PortalLayout>
  );
};

export default CitizenDashboard;
