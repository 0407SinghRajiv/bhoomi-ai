import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  Filter,
  Check,
  Edit3,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { CadastralMap } from '../../components/gis/CadastralMap';
import { ParcelInfoPanel } from '../../components/gis/ParcelInfoPanel';
import { OriginalDocumentViewer } from '../../components/document/OriginalDocumentViewer';
import { api } from '../../services/api';
import type {
  ApiCadastralParcel,
  ApiCadastralParcelDetail,
} from '../../services/api';

export const AuthorityGISView: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [parcels, setParcels] = useState<ApiCadastralParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ApiCadastralParcelDetail | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Verify / Correction Modal State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyOwnerName, setVerifyOwnerName] = useState<string>('');
  const [verifySurveyNum, setVerifySurveyNum] = useState<string>('');
  const [verifyArea, setVerifyArea] = useState<number>(0);
  const [verifyStatus, setVerifyStatus] = useState<string>('VERIFIED');
  const [verifyReason, setVerifyReason] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>('Revenue Officer R. K. Patil');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Original Document Viewer Modal
  const [viewerDocId, setViewerDocId] = useState<number | null>(null);
  const [viewerFields, setViewerFields] = useState<any[]>([]);

  useEffect(() => {
    loadParcels();
  }, [filterStatus]);

  const loadParcels = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCadastralParcels({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
      });
      setParcels(data);

      // Select first parcel or 124/2
      const p124 = data.find((p) => p.parcel_number === '124/2') || data[0];
      if (p124) {
        setSelectedParcelId(p124.id);
        const detail = await api.getCadastralParcelDetail(p124.id);
        setSelectedParcel(detail);
        initVerifyForm(detail);
      }
    } catch (err) {
      console.error('Failed to load cadastral parcels for authority:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const initVerifyForm = (detail: ApiCadastralParcelDetail) => {
    setVerifyOwnerName(detail.owner_name);
    setVerifySurveyNum(detail.survey_number);
    setVerifyArea(detail.area);
    setVerifyStatus(detail.status === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED');
    setVerifyReason('Field verification and deed cross-check completed against Sub-Registrar Volume index.');
  };

  const handleSelectParcel = async (parcel: ApiCadastralParcel) => {
    setSelectedParcelId(parcel.id);
    try {
      const detail = await api.getCadastralParcelDetail(parcel.id);
      setSelectedParcel(detail);
      initVerifyForm(detail);
    } catch (err) {
      console.error('Failed to fetch parcel detail:', err);
    }
  };

  const handleOpenDocViewer = async (docId: number) => {
    try {
      const extractions = await api.getDocumentExtractions(docId);
      setViewerFields(extractions.fields || []);
    } catch {
      setViewerFields([]);
    }
    setViewerDocId(docId);
  };

  const handleExecuteVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcelId) return;

    setIsSubmittingAction(true);
    try {
      const updated = await api.verifyCadastralParcel(selectedParcelId, {
        owner_name: verifyOwnerName,
        survey_number: verifySurveyNum,
        area: verifyArea,
        status: verifyStatus,
        reason: verifyReason,
        officer_name: officerName,
      });

      setSelectedParcel(updated);
      setIsVerifying(false);
      setActionSuccessMsg(`Parcel ${updated.parcel_number} successfully verified/updated! Audit log recorded.`);
      setTimeout(() => setActionSuccessMsg(null), 5000);

      // Refresh parcel list to reflect status badge
      const data = await api.getCadastralParcels({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
      });
      setParcels(data);
    } catch (err: any) {
      alert(`Verification failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <PortalLayout
      portalType="authority"
      title="Cadastral GIS Verification Workbench"
      subtitle="Spatial Land Record Analysis & Revenue Parcel Authentication"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Success Alert */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              REVENUE OFFICER GIS WORKBENCH
            </span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 ml-2" />}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Status:
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Parcels ({parcels.length})</option>
              <option value="NEEDS_REVIEW">Needs Verification</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
        </div>

        {/* Main Workspace: GIS Map + Parcel Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <CadastralMap
              parcels={parcels}
              selectedParcelId={selectedParcelId}
              onSelectParcel={handleSelectParcel}
              height="620px"
            />
          </div>

          {/* Right Inspector Column (1 col) */}
          <div className="lg:col-span-1 space-y-4">
            <ParcelInfoPanel
              parcel={selectedParcel}
              onViewRecord={(recId) => navigate(`/citizen/land/${recId}`)}
              onViewDocument={(docId) => handleOpenDocViewer(docId)}
              onViewEvidence={(caseId) => navigate(`/authority/cases/${caseId || 'CASE-MH-2026-001'}`)}
              onVerifyParcel={() => setIsVerifying(true)}
              isAuthority={true}
            />

            {/* Quick Authority Case Actions Card */}
            {selectedParcel && (
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-xl p-4 border border-indigo-800/60 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                    AUTHORITY ACTION
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Case {selectedParcel.reconciliation?.case_number || 'CASE-MH-2026-001'}
                  </span>
                </div>

                <div className="text-xs font-bold text-white mb-2">
                  Parcel {selectedParcel.survey_number} &bull; {selectedParcel.owner_name}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => setIsVerifying(true)}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Verify Parcel</span>
                  </button>

                  <Link
                    to={`/authority/cases/${selectedParcel.reconciliation?.case_number || 'CASE-MH-2026-001'}`}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 text-center"
                  >
                    <span>Open Case</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification / Correction Modal */}
      {isVerifying && selectedParcel && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in text-slate-900">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Verify & Correct Cadastral Parcel #{selectedParcel.parcel_number}
                </h3>
              </div>
              <button
                onClick={() => setIsVerifying(false)}
                className="text-slate-400 hover:text-white text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExecuteVerification} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={verifyOwnerName}
                  onChange={(e) => setVerifyOwnerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Survey / Gat Number</label>
                  <input
                    type="text"
                    value={verifySurveyNum}
                    onChange={(e) => setVerifySurveyNum(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={verifyArea}
                    onChange={(e) => setVerifyArea(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="VERIFIED">VERIFIED — Confirm Registered Title</option>
                  <option value="NEEDS_REVIEW">NEEDS_REVIEW — Flag for Additional Field Inquiry</option>
                  <option value="REJECTED">REJECTED — Title Transfer Disallowed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Justification / Order Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={verifyReason}
                  onChange={(e) => setVerifyReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter revenue officer justification for audit trail..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Officer Name / Designation</label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save Verification & Log Audit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Original Document Viewer Modal */}
      {viewerDocId && (
        <OriginalDocumentViewer
          documentId={viewerDocId}
          extractedFields={viewerFields}
          onClose={() => setViewerDocId(null)}
        />
      )}
    </PortalLayout>
  );
};
