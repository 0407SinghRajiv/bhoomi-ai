import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  Eye,
  Layers,
  Loader2,
  Lock,
  Unlock,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { CadastralMap } from '../../components/gis/CadastralMap';
import { OriginalDocumentViewer } from '../../components/document/OriginalDocumentViewer';
import { OfficialLandDocumentViewer } from '../../components/document/OfficialLandDocumentViewer';
import { AccessRequestModal } from '../../components/citizen/AccessRequestModal';
import { api } from '../../services/api';
import type { ApiLandRecordDetail, ApiCadastralParcel } from '../../services/api';

const CITIZEN_NAME = 'Rajendra Dattatray Patil';

export const CitizenLandDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [record, setRecord] = useState<ApiLandRecordDetail | null>(null);
  const [allParcels, setAllParcels] = useState<ApiCadastralParcel[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Request Access Modal
  const [accessModalOpen, setAccessModalOpen] = useState<boolean>(false);

  // Document Viewer Modal States
  const [viewerDocId, setViewerDocId] = useState<number | null>(null);
  const [viewerHighlightBox, setViewerHighlightBox] = useState<number[] | null>(null);
  const [viewerHighlightField, setViewerHighlightField] = useState<string | null>(null);
  const [viewerFields, setViewerFields] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadLandRecordDetail(parseInt(id));
    }
  }, [id]);

  const loadLandRecordDetail = async (recordId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch full land record detail passing current citizen identity
      const rec = await api.getLandRecordDetail(recordId, CITIZEN_NAME);
      setRecord(rec);

      // 2. Fetch all parcels for GIS map context
      const parcels = await api.getCadastralParcels();
      setAllParcels(parcels);
    } catch (err: any) {
      console.error('Failed to load land record:', err);
      setError(err.message || 'Could not load land record details from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDocViewer = async (docId: number, fieldName?: string, box?: number[] | null) => {
    try {
      const extractions = await api.getDocumentExtractions(docId);
      setViewerFields(extractions.fields || []);
    } catch {
      setViewerFields(record?.extractions || []);
    }
    setViewerDocId(docId);
    setViewerHighlightField(fieldName || null);
    setViewerHighlightBox(box || null);
  };

  const handleAccessRequestSuccess = () => {
    if (id) {
      loadLandRecordDetail(parseInt(id));
    }
  };

  if (isLoading) {
    return (
      <PortalLayout portalType="citizen" title="Land Record Detail">
        <div className="min-h-[450px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">Retrieving land record and cadastral geometry...</p>
        </div>
      </PortalLayout>
    );
  }

  if (error || !record) {
    return (
      <PortalLayout portalType="citizen" title="Land Record Not Found">
        <div className="max-w-xl mx-auto my-12 bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Record Not Found</h3>
          <p className="text-xs text-slate-500 mt-1">{error || 'Unable to find land record with the specified ID.'}</p>
          <Link
            to="/citizen/land"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Land Holdings
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isRestricted = record.is_restricted;
  const parcelObj = record.cadastral_parcel;
  const selectedParcelId = parcelObj?.id || null;

  return (
    <PortalLayout
      portalType="citizen"
      title={`Land Record: Survey No. ${record.survey_number}`}
      subtitle={`${record.village}, Taluka ${record.taluka_tehsil}, District ${record.district}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-slate-900">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/citizen/land"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Land Holdings</span>
          </Link>

          <div className="flex items-center gap-2">
            {isRestricted ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted Record (Authority Authorization Required)</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" />
                <span>{record.is_owner ? 'Your Verified Property' : 'Authorized Access Granted'}</span>
              </span>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RESTRICTED ACCESS VIEW (IF NOT CITIZEN'S OWN OR APPROVED) */}
        {/* ======================================================== */}
        {isRestricted ? (
          <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xl p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-amber-700 uppercase">
                    Privacy-Protected Revenue Record
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    Survey No. {record.survey_number} &bull; {record.village}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This parcel belongs to an external khatedar ({record.owner_name}). Full 7/12 extract and registered deeds are locked.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAccessModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md transition shrink-0"
              >
                <Lock className="w-4 h-4" />
                <span>Request Access to Authority</span>
              </button>
            </div>

            {/* Public details only */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Survey Number</span>
                <span className="font-mono font-bold text-slate-900">{record.survey_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Village / मौजे</span>
                <span className="font-bold text-slate-900">{record.village}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Land Category</span>
                <span className="font-semibold text-slate-800">{record.land_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Area</span>
                <span className="font-mono font-bold text-slate-900">{record.area_value} {record.area_unit}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>How to inspect this record:</span>
              </div>
              <p className="leading-relaxed">
                Click <strong>"Request Access to Authority"</strong> above and select your legal purpose
                (e.g., adjacent landowner boundary check, property due diligence, or inheritance claim).
                Once the Tahsildar / Sub-Registrar approves your request, the certified Form 7/12 extract,
                mutation register, and linked documents will automatically be unlocked for 30 days.
              </p>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* AUTHORIZED FULL RECORD & OFFICIAL FORMATTED 7/12 EXTRACT */
          /* ======================================================== */
          <div className="space-y-6">
            {/* AI Name Conflict Intelligence Box (if present) */}
            {record.name_conflict_detail && (
              <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      BhoomiAI Discrepancy Intelligence: Typographical Variance Detected
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-200 text-amber-900">
                    Phonetic Match: {(record.name_conflict_detail.phonetic_similarity * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Canonical Legal Name (Registered Sale Deed)
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                      {record.name_conflict_detail.primary_canonical_name} (राजेश कुमार)
                    </span>
                    <span className="text-[11px] text-slate-500">Confirmed by Registered Deed #REG-2018-74921</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">
                      Clerical Typo Variant (Mutation Ferfar Record)
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                      {record.name_conflict_detail.conflicting_variant} (राकेश कुमार)
                    </span>
                    <span className="text-[11px] text-slate-500">Typo in Ferfar #894 Devanagari transcription</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  <strong>AI Analysis:</strong> {record.name_conflict_detail.root_cause}
                  <br />
                  <strong>Recommendation:</strong> {record.name_conflict_detail.recommendation}
                </p>
              </div>
            )}

            {/* Official Statutory Form 7/12 & Mutation Formatter */}
            <OfficialLandDocumentViewer record={record} />

            {/* Cadastral Satellite GIS Overlay */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 font-mono">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Cadastral Map Overlay
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Parcel <span className="font-bold text-emerald-700">#{record.survey_number}</span> Highlighted
                </span>
              </div>

              <CadastralMap
                parcels={allParcels}
                selectedParcelId={selectedParcelId}
                height="420px"
                citizenName={CITIZEN_NAME}
                ownedSurveyNumbers={[record.survey_number]}
              />
            </div>

            {/* Source Documents & Evidentiary Scans */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Source Documents & Registered Deeds ({record.documents?.length || 0})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Original scanned evidence documents synchronized with the computerized extract.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {record.documents && record.documents.length > 0 ? (
                  record.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 line-clamp-2">
                          {doc.document_type_name || doc.file_name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'} &bull; {doc.status}
                        </p>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-200/80">
                        <button
                          onClick={() => handleOpenDocViewer(doc.id)}
                          className="w-full py-2 px-3 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Scanned Original</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic col-span-3">No raw scanned documents linked.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Access Request Submission Modal */}
      {isRestricted && (
        <AccessRequestModal
          isOpen={accessModalOpen}
          onClose={() => setAccessModalOpen(false)}
          onSuccess={handleAccessRequestSuccess}
          targetParcel={{
            record_id: record.id,
            parcel_id: record.cadastral_parcel?.id,
            survey_number: record.survey_number,
            village: record.village,
            district: record.district,
            owner_name: record.owner_name,
            area: record.area_value,
            area_unit: record.area_unit,
          }}
          applicantName={CITIZEN_NAME}
        />
      )}

      {/* Original Document Viewer Modal */}
      {viewerDocId && (
        <OriginalDocumentViewer
          documentId={viewerDocId}
          highlightFieldName={viewerHighlightField}
          highlightBox={viewerHighlightBox}
          extractedFields={viewerFields}
          onClose={() => setViewerDocId(null)}
        />
      )}
    </PortalLayout>
  );
};
