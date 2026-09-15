import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Shield,
  Eye,
  Scale,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { ApiCadastralParcelDetail } from '../../services/api';

interface ParcelInfoPanelProps {
  parcel: ApiCadastralParcelDetail | null;
  onClose?: () => void;
  onViewRecord?: (recordId: number) => void;
  onViewDocument?: (docId: number) => void;
  onViewEvidence?: (caseId?: string | number) => void;
  onVerifyParcel?: (parcelId: number) => void;
  isAuthority?: boolean;
}

export const ParcelInfoPanel: React.FC<ParcelInfoPanelProps> = ({
  parcel,
  onClose,
  onViewRecord,
  onViewDocument,
  onViewEvidence,
  onVerifyParcel,
  isAuthority = false,
}) => {
  if (!parcel) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500">
        <Layers className="w-12 h-12 text-slate-300 mb-3" />
        <h4 className="text-sm font-semibold text-slate-700">No Parcel Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Click any parcel boundary on the cadastral map or search by Survey/Gat number to inspect ownership and records.
        </p>
      </div>
    );
  }

  // Dynamic Land Parcel identifier label
  const parcelLabel = parcel.gat_number
    ? `Gat No. ${parcel.gat_number}`
    : parcel.khasra_number
    ? `Khasra No. ${parcel.khasra_number}`
    : `Survey No. ${parcel.survey_number}`;

  const isVerified = parcel.status === 'VERIFIED';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col max-h-[800px]">
      {/* Panel Header */}
      <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
            CADASTRAL PARCEL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isVerified
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                : 'bg-amber-900/80 text-amber-300 border border-amber-700'
            }`}
          >
            {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {isVerified ? 'Verified' : 'Needs Verification'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-base leading-none px-1"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-5 divide-y divide-slate-100 text-slate-800">
        {/* Section 1: Land Parcel Identity */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-mono">
              {parcelLabel}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Parcel #{parcel.parcel_number}
            </span>
          </div>

          <div className="space-y-2.5 mt-3 text-xs">
            {/* Landowner Name */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Registered Landowner
              </span>
              <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                <span>{parcel.owner_name}</span>
                {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              {parcel.owner_name_native && (
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  {parcel.owner_name_native}
                </div>
              )}
              {parcel.confidence < 0.9 && (
                <div className="text-[10px] text-amber-700 font-semibold mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ⚠️ Owner name requires manual authority verification
                </div>
              )}
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Area</span>
                <span className="text-xs font-bold text-slate-900">
                  {parcel.area} {parcel.area_unit}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Land Type</span>
                <span className="text-xs font-bold text-slate-900 truncate block" title={parcel.land_type}>
                  {parcel.land_type}
                </span>
              </div>
            </div>

            {/* Location Details */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1 text-slate-600 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Village / मौजे:</span>
                <span className="font-semibold text-slate-900">{parcel.village}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Taluka / Tehsil:</span>
                <span className="font-semibold text-slate-900">{parcel.tehsil}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">District:</span>
                <span className="font-semibold text-slate-900">{parcel.district}, {parcel.state}</span>
              </div>
              {parcel.khata_number && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Khata No:</span>
                  <span className="font-mono font-semibold text-slate-900">{parcel.khata_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Associated Source Documents */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Source Documents ({parcel.documents?.length || 0})
            </h4>
            {parcel.record_id && onViewRecord && (
              <button
                onClick={() => onViewRecord(parcel.record_id!)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
              >
                View Record <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {parcel.documents && parcel.documents.length > 0 ? (
              parcel.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {doc.document_type_name || doc.file_name}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{doc.page_count} {doc.page_count === 1 ? 'Page' : 'Pages'}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-semibold">{doc.status}</span>
                    </div>
                  </div>

                  {onViewDocument && (
                    <button
                      onClick={() => onViewDocument(doc.id)}
                      className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 text-[11px] font-semibold transition shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>Original</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No direct documents uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Section 3: AI Triad Reconciliation */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              Reconciliation Summary
            </h4>
            {parcel.reconciliation && onViewEvidence && (
              <button
                onClick={() => onViewEvidence(parcel.reconciliation?.case_id || undefined)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
              >
                View Evidence <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-2 text-xs">
            {/* Field Status Checks */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Owner Identity</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Survey / Gat Number</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">Normalized Area</span>
              {parcel.reconciliation?.conflicts_count ? (
                <span className="font-semibold text-amber-700 flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Variance Flagged
                </span>
              ) : (
                <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Authority Actions (when accessed in Authority portal) */}
        {isAuthority && onVerifyParcel && (
          <div className="pt-4">
            <button
              onClick={() => onVerifyParcel(parcel.id)}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm hover:shadow transition flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>Verify / Correct Parcel</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
