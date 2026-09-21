import React, { useState } from 'react';
import {
  X,
  Send,
  AlertCircle,
  Lock,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api';
import type { ApiAccessRequest, ApiAccessRequestCreate } from '../../services/api';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (request: ApiAccessRequest) => void;
  targetParcel: {
    parcel_id?: number | null;
    record_id?: number | null;
    survey_number: string;
    village: string;
    district: string;
    owner_name?: string | null;
    area?: number | null;
    area_unit?: string | null;
  };
  applicantName?: string;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetParcel,
  applicantName = 'Rajendra Dattatray Patil',
}) => {
  const [applicantContact, setApplicantContact] = useState('+91 98220 14920');
  const [reasonCategory, setReasonCategory] = useState('BOUNDARY_VERIFICATION');
  const [reasonDescription, setReasonDescription] = useState(
    'I am the adjacent landowner of Gat 124/2. I request permission to inspect the official 7/12 extract and mutation records to verify common boundary lines for boundary fence installation.'
  );
  const [agreedDeclaration, setAgreedDeclaration] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedDeclaration) {
      setError('You must accept the statutory declaration to proceed.');
      return;
    }
    if (!reasonDescription.trim()) {
      setError('Please provide a specific legal reason for accessing this land record.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ApiAccessRequestCreate = {
        applicant_name: applicantName,
        applicant_role: 'CITIZEN',
        applicant_contact: applicantContact,
        target_parcel_id: targetParcel.parcel_id || null,
        target_record_id: targetParcel.record_id || null,
        survey_number: targetParcel.survey_number,
        village: targetParcel.village,
        district: targetParcel.district,
        owner_name: targetParcel.owner_name || null,
        reason_category: reasonCategory,
        reason_description: reasonDescription.trim(),
      };

      const result = await api.createAccessRequest(payload);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit access request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Official Record Access Request</span>
              </h2>
              <p className="text-xs text-slate-300">
                Submit formal application to Revenue Authority (Tahsildar / Sub-Registrar)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Parcel Summary Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider">
                Restricted Target Parcel
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200/70 text-amber-900">
                Requires Authority Approval
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Survey / Gat No.:</span>
                <span className="font-mono font-bold text-slate-900">{targetParcel.survey_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Location:</span>
                <span className="font-bold text-slate-900">
                  {targetParcel.village}, {targetParcel.district}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Current Khatedar / Owner:</span>
                <span className="font-semibold text-slate-800">
                  {targetParcel.owner_name || 'Protected Landowner'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Land Area:</span>
                <span className="font-bold text-slate-800">
                  {targetParcel.area ? `${targetParcel.area} ${targetParcel.area_unit || 'Ha'}` : 'Agricultural Land'}
                </span>
              </div>
            </div>
          </div>

          {/* Applicant Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Applicant Name
              </label>
              <input
                type="text"
                disabled
                value={applicantName}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone / Aadhaar ID
              </label>
              <input
                type="text"
                value={applicantContact}
                onChange={(e) => setApplicantContact(e.target.value)}
                placeholder="+91 Mobile number"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Purpose & Statutory Reason for Inspection
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="BOUNDARY_VERIFICATION">Adjacent Landowner Boundary Verification (हद्द व सीमा तपासणी)</option>
              <option value="TITLE_DILIGENCE">Property Purchase Title Due Diligence (खरेदीपूर्व मालकी हक्क तपासणी)</option>
              <option value="LEGAL_SUCCESSION">Inheritance & Legal Succession Claim (वारस हक्क व नोंद तपासणी)</option>
              <option value="EASEMENT_INQUIRY">Right-of-Way / Water Channel Easement (रस्ता व वहिवाट हक्क)</option>
              <option value="OTHER">Other Certified Revenue Inquiry (इतर अधिकृत महसूल कारण)</option>
            </select>
          </div>

          {/* Reason Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Justification / Particulars
            </label>
            <textarea
              rows={3}
              value={reasonDescription}
              onChange={(e) => setReasonDescription(e.target.value)}
              placeholder="State why you require access to this land record..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400"
            />
          </div>

          {/* Legal Declaration */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="declaration"
              checked={agreedDeclaration}
              onChange={(e) => setAgreedDeclaration(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="declaration" className="text-[11px] text-slate-600 leading-snug cursor-pointer">
              I solemnly declare that this request is made in good faith under Section 148 of Maharashtra Land Revenue Code for genuine verification purposes. Any misuse of inspected records is punishable under the IT Act & MLRC.
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Authority...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Access Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
