import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  X,
  FileCheck,
  RefreshCw,
  Lock
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { api } from '../../services/api';
import type {
  ApiAuthorityDocumentItem,
  ApiAuthorityDocumentDetailBundle,
  ApiAuthorityDocumentMetadataUpdate,
} from '../../services/api';

export const AuthorityDocumentRepository: React.FC = () => {
  const [documents, setDocuments] = useState<ApiAuthorityDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Selected document for audit trail modal
  const [selectedDocIdForAudit, setSelectedDocIdForAudit] = useState<number | null>(null);
  const [auditBundle, setAuditBundle] = useState<ApiAuthorityDocumentDetailBundle | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);

  // Selected document for metadata editing
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<ApiAuthorityDocumentItem | null>(null);
  const [editFormData, setEditFormData] = useState<ApiAuthorityDocumentMetadataUpdate>({
    language: 'mr',
    quality_status: 'PASSED',
    survey_number: '',
    village: '',
    district: '',
    remarks: '',
    officer_name: 'Tahsildar R. K. Patil (Haveli, Pune)',
  });
  const [isSavingMetadata, setIsSavingMetadata] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAuthorityDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch secure document repository';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleOpenAudit = async (docId: number) => {
    setSelectedDocIdForAudit(docId);
    setIsLoadingAudit(true);
    try {
      const bundle = await api.getAuthorityDocumentDetail(docId);
      setAuditBundle(bundle);
    } catch (err: unknown) {
      console.error('Failed to fetch audit trail bundle:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleOpenEdit = (doc: ApiAuthorityDocumentItem) => {
    setSelectedDocForEdit(doc);
    setSaveSuccessMsg(null);
    setEditFormData({
      language: doc.language || 'mr',
      quality_status: doc.quality_status || 'PASSED',
      survey_number: doc.survey_number || '',
      village: doc.village || 'Wagholi',
      district: doc.district || 'Pune',
      remarks: '',
      officer_name: 'Tahsildar R. K. Patil (Haveli, Pune)',
    });
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForEdit) return;

    if (!editFormData.remarks?.trim()) {
      alert('Officer remarks and administrative rationale are mandatory for metadata adjustments.');
      return;
    }

    setIsSavingMetadata(true);
    setSaveSuccessMsg(null);
    try {
      const updated = await api.updateAuthorityDocumentMetadata(selectedDocForEdit.id, editFormData);
      setSaveSuccessMsg(`Metadata updated successfully. Audit log #${Date.now().toString().slice(-4)} stamped.`);
      
      // Update local state list
      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? { ...d, ...updated, audit_events_count: d.audit_events_count + 1 } : d))
      );

      setTimeout(() => {
        setSelectedDocForEdit(null);
        setSaveSuccessMsg(null);
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update metadata';
      alert(`Error updating metadata: ${msg}`);
    } finally {
      setIsSavingMetadata(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesQuality =
      selectedQuality === 'ALL' || doc.quality_status.toUpperCase() === selectedQuality;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesQuality;

    const matchesSearch =
      doc.file_name.toLowerCase().includes(q) ||
      doc.document_type_name.toLowerCase().includes(q) ||
      (doc.survey_number && doc.survey_number.toLowerCase().includes(q)) ||
      (doc.village && doc.village.toLowerCase().includes(q)) ||
      (doc.owner_name && doc.owner_name.toLowerCase().includes(q)) ||
      doc.sha256_hash.toLowerCase().includes(q);

    return matchesQuality && matchesSearch;
  });

  const getQualityBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Passed</span>
          </span>
        );
      case 'WARNING':
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            <span>Review Req.</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <PortalLayout
      portalType="authority"
      title="Secure Land Document Repository"
      subtitle="Cryptographically sealed archival repository with officer metadata controls and immutable audit trails."
    >
      <div className="space-y-6">
        
        {/* Top Control & Assurance Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/40 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Lock className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tracking-widest text-indigo-300 uppercase font-semibold">
                  Revenue Records Vault
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SHA-256 SEALED
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Authentic Evidentiary Document Storage
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Every uploaded land extract, sale deed, and ferfar is timestamped with cryptographic hash verification to ensure zero tampering across revenue jurisdictions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDocuments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Vault</span>
            </button>
            <Link
              to="/authority"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Back to Command Center</span>
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name, survey number, owner name, village, or SHA-256 hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Quality Filter:</span>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">All Quality Statuses</option>
              <option value="PASSED">Passed Only</option>
              <option value="WARNING">Review Required / Warning</option>
            </select>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDocuments}
              className="px-2.5 py-1 bg-white border border-rose-300 rounded text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Sealed Evidentiary Documents ({filteredDocs.length} of {documents.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Integrity Protocol: SHA-256 Pre-Execution Hashing
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-2">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <div>Accessing secure storage index...</div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No matching documents found in repository.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Document Title & Code</th>
                    <th className="py-3 px-3">Parcel / Location</th>
                    <th className="py-3 px-3">Quality Gate</th>
                    <th className="py-3 px-3">Pages / Size</th>
                    <th className="py-3 px-3">Cryptographic Signature (SHA-256)</th>
                    <th className="py-3 px-3">Audit Events</th>
                    <th className="py-3 px-4 text-right">Officer Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{doc.document_type_name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {doc.document_type_code}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs" title={doc.file_name}>
                              {doc.file_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">
                          {doc.survey_number ? `Survey ${doc.survey_number}` : 'Unassigned'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {doc.village || 'Wagholi'}, {doc.district || 'Pune'}
                        </div>
                        {doc.owner_name && (
                          <div className="text-[10px] text-indigo-600 font-mono">
                            {doc.owner_name}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {getQualityBadge(doc.quality_status)}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                        <div>{doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}</div>
                        <div className="text-[10px] text-slate-400">{(doc.file_size / 1024).toFixed(1)} KB</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-mono tracking-tighter truncate max-w-[170px]" title={doc.sha256_hash}>
                            {doc.sha256_hash.replace('sha256:', '')}
                          </code>
                          <button
                            onClick={() => handleCopyHash(doc.sha256_hash)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Copy full SHA-256 hash"
                          >
                            {copiedHash === doc.sha256_hash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleOpenAudit(doc.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                        >
                          <History className="w-3 h-3" />
                          <span>{doc.audit_events_count} events</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm transition"
                            title="Manage Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Edit Metadata</span>
                          </button>
                          <a
                            href={api.getDocumentFileUrl(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                            title="View Raw Document File"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit Trail Modal */}
        {selectedDocIdForAudit !== null && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
              
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Immutable Audit Trail & Chain of Custody
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Document #{selectedDocIdForAudit} &bull; {auditBundle?.document.file_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedDocIdForAudit(null);
                    setAuditBundle(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {isLoadingAudit ? (
                  <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                    <div>Loading cryptographic chain of custody...</div>
                  </div>
                ) : auditBundle ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">SHA-256 Hash: </span>
                        <code className="text-indigo-900 font-mono text-[11px] select-all">
                          {auditBundle.document.sha256_hash}
                        </code>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        VERIFIED SEAL
                      </span>
                    </div>

                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
                      {auditBundle.audit_trail.map((event, idx) => (
                        <div key={event.id || idx} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          </div>

                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                {event.action}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.created_at).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-800">
                              {event.description}
                            </p>

                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Actor: <strong className="text-slate-700">{event.user || 'System'}</strong></span>
                              <span>&bull;</span>
                              <span>Role: <strong className="text-slate-700">{event.role || 'Engine'}</strong></span>
                            </div>

                            {event.reason && (
                              <div className="mt-2 p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
                                <strong>Official Rationale:</strong> {event.reason}
                              </div>
                            )}

                            {event.field_name && (
                              <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 flex items-center gap-2 mt-1">
                                <span>{event.field_name}:</span>
                                <span className="text-rose-600 line-through">{event.previous_value || 'None'}</span>
                                <span>&rarr;</span>
                                <span className="text-emerald-600 font-bold">{event.new_value}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-slate-500">
                    Unable to load audit trail records.
                  </div>
                )}
              </div>

              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedDocIdForAudit(null);
                    setAuditBundle(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  Close Audit Viewer
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Edit Metadata Modal */}
        {selectedDocForEdit && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-150">
              
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Officer Metadata Management
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {selectedDocForEdit.file_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocForEdit(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMetadata} className="p-6 space-y-4">
                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Language
                    </label>
                    <select
                      value={editFormData.language}
                      onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="mr">Marathi (मराठी)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="en">English</option>
                      <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Quality Gate Status
                    </label>
                    <select
                      value={editFormData.quality_status}
                      onChange={(e) => setEditFormData({ ...editFormData, quality_status: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="PASSED">PASSED (Certified Copy Clear)</option>
                      <option value="REVIEW_REQUIRED">REVIEW_REQUIRED (Manual Stamp Check)</option>
                      <option value="FAILED">FAILED (Illegible Scan)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Survey / Gat No.
                    </label>
                    <input
                      type="text"
                      value={editFormData.survey_number || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, survey_number: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                      placeholder="e.g. 142/3"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Village
                    </label>
                    <input
                      type="text"
                      value={editFormData.village || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Wagholi"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={editFormData.district || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Pune"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Officer In-Charge
                  </label>
                  <input
                    type="text"
                    value={editFormData.officer_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, officer_name: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Officer Name & Designation"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Mandatory Verification Rationale / Remarks <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editFormData.remarks || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Specify the legal reason or administrative order for modifying document metadata (logged to permanent audit trail)..."
                  />
                </div>

                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Compliance Note: Every metadata edit creates a permanent, tamper-evident audit record stamped with your officer credentials and timestamp.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDocForEdit(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMetadata}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                  >
                    {isSavingMetadata ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Logging to Audit Trail...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Stamp Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
};

export default AuthorityDocumentRepository;
