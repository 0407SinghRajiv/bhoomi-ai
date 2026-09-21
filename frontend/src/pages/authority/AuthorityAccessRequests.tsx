import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { api } from '../../services/api';
import type { ApiAccessRequest, ApiAccessRequestReview } from '../../services/api';

export const AuthorityAccessRequests: React.FC = () => {
  const [requests, setRequests] = useState<ApiAccessRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<string>(
    'Insufficient legal interest demonstrated or incomplete supporting documentation under MLRC Section 148.'
  );

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAccessRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionInProgressId(id);
    try {
      const payload: ApiAccessRequestReview = {
        status: 'APPROVED',
        reviewed_by: 'Tahsildar Haveli, Pune',
        review_remarks: 'Verified adjacent owner credentials; approved for certified inspection under MLRC Sec 148.',
        valid_days: 30,
      };
      await api.reviewAccessRequest(id, payload);
      await fetchRequests();
    } catch (err) {
      alert('Failed to approve request.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleOpenRejectModal = (id: number) => {
    setSelectedReqId(id);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReqId) return;
    setActionInProgressId(selectedReqId);
    try {
      const payload: ApiAccessRequestReview = {
        status: 'REJECTED',
        reviewed_by: 'Tahsildar Haveli, Pune',
        review_remarks: rejectReason,
      };
      await api.reviewAccessRequest(selectedReqId, payload);
      setRejectModalOpen(false);
      setSelectedReqId(null);
      await fetchRequests();
    } catch (err) {
      alert('Failed to reject request.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        r.applicant_name.toLowerCase().includes(q) ||
        r.survey_number.toLowerCase().includes(q) ||
        (r.owner_name && r.owner_name.toLowerCase().includes(q)) ||
        r.village.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;

  return (
    <PortalLayout
      portalType="authority"
      title="Citizen Record Access Requests"
      subtitle="Statutory oversight of citizen land record inspection requests under Maharashtra Land Revenue Code, 1966"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Pending Authority Review
              </span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Approved Access Granted
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{approvedCount}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Requests Ingested
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{requests.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL'
                  ? 'All Requests'
                  : s === 'PENDING'
                  ? `Pending (${pendingCount})`
                  : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Applicant, Survey No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Requests Queue Table / Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Loading access requests from database...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No access requests matching current filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((req) => {
                const isApproved = req.status === 'APPROVED';
                const isPending = req.status === 'PENDING';
                const isRejected = req.status === 'REJECTED';
                const isWorking = actionInProgressId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-slate-50/70 transition"
                  >
                    {/* Left details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-mono font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          REQ #{req.id}
                        </span>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Applicant: {req.applicant_name}
                        </h3>
                        {req.applicant_contact && (
                          <span className="text-xs font-mono text-slate-500">
                            ({req.applicant_contact})
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          <span>{req.status}</span>
                        </span>
                      </div>

                      {/* Target Info */}
                      <div className="text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <strong className="text-slate-500">Target Parcel:</strong> Survey No.{' '}
                          <span className="font-mono font-bold text-slate-900">{req.survey_number}</span>,{' '}
                          {req.village}, {req.district}
                        </div>
                        <div>
                          <strong className="text-slate-500">Target Khatedar:</strong>{' '}
                          <span className="font-semibold text-slate-900">{req.owner_name || 'Protected Owner'}</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="text-xs text-slate-600">
                        <strong className="text-slate-700">Purpose / Statutory Reason:</strong>{' '}
                        <span className="text-blue-900 font-semibold">{req.reason_category}</span> &bull;{' '}
                        <span className="italic text-slate-600">"{req.reason_description}"</span>
                      </div>

                      {req.reviewed_by && (
                        <div className="text-[11px] text-slate-500">
                          Decision by: <strong className="text-slate-800">{req.reviewed_by}</strong>
                          {req.review_remarks && ` — "${req.review_remarks}"`}
                          {req.valid_until && (
                            <span className="text-emerald-700 font-semibold ml-2">
                              (Valid through: {new Date(req.valid_until).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending ? (
                        <>
                          <button
                            disabled={isWorking}
                            onClick={() => handleApprove(req.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                          >
                            {isWorking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Approve Access (30 Days)</span>
                          </button>

                          <button
                            disabled={isWorking}
                            onClick={() => handleOpenRejectModal(req.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                          Decision Recorded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Record Access Request</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Specify the legal reason for denying access under Maharashtra Land Revenue Code regulations.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Reason for Denial
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                Confirm Denial
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
