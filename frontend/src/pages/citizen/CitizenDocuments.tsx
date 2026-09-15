import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  UploadCloud,
  Layers,
  ArrowRight,
  FileText,
  Trash2,
  CheckCircle2,
  Database,
  GitCompare
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAppState } from '../../context/AppStateContext';
import { api } from '../../services/api';
import type { ApiDocument } from '../../services/api';

export const CitizenDocuments: React.FC = () => {
  const { selectedState } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch documents';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert('Failed to delete document');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      doc.file_name.toLowerCase().includes(term) ||
      (doc.document_type?.name && doc.document_type.name.toLowerCase().includes(term));
    return matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PortalLayout
      portalType="citizen"
      title="Citizen Document Repository"
      subtitle="Structured vault of your ingested land deeds, extracts, and extracted entity indices."
    >
      <div className="space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by document name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
              <span>Jurisdiction: {selectedState}</span>
            </span>
            <Link
              to="/citizen/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New</span>
            </Link>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="border border-slate-200 rounded-xl bg-white p-12 text-center text-xs text-slate-500 shadow-sm">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
            Loading documents from database...
          </div>
        )}

        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded-xl p-4 text-xs text-rose-800 shadow-sm">
            {error}
          </div>
        )}

        {/* Document Table / List */}
        {!isLoading && filteredDocs.length > 0 && (
          <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredDocs.length && filteredDocs.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(filteredDocs.map((d) => d.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  title="Select All"
                />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Indexed Documents ({filteredDocs.length})
                </h3>
              </div>

              {selectedIds.length >= 2 ? (
                <Link
                  to={`/citizen/analysis?doc_ids=${selectedIds.join(',')}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition animate-pulse"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Reconcile Selected Documents ({selectedIds.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">
                  Select 2+ documents to reconcile
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-200">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    selectedIds.includes(doc.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => {
                        setSelectedIds((prev) =>
                          prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                        );
                      }}
                      className="mt-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{doc.file_name}</h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                          {doc.document_type?.name || 'Document'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600">
                          {doc.language.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Size: {formatFileSize(doc.file_size)}</span>
                        <span>•</span>
                        <span>Pages: {doc.page_count}</span>
                        <span>•</span>
                        <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      to={`/citizen/documents/${doc.id}/extraction`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shadow-xs transition"
                      title="Inspect Structured Fields & Evidence"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Structured Fields</span>
                    </Link>

                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Delete document"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State Card (When no documents match or exist) */}
        {!isLoading && filteredDocs.length === 0 && (
          <div className="border border-slate-200 rounded-xl bg-white p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-sm">
              <Layers className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                No Document Records Found
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {searchTerm
                  ? 'No documents matched your search filter.'
                  : 'Documents uploaded via the Citizen Upload pipeline will be indexed here.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                to="/citizen/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                <span>Upload Documents for {selectedState}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Architecture Checklist */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
          <div className="text-xs font-mono text-slate-700 font-bold">
            Live Database Metadata Fields (Phase 2 Data Model):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 font-mono">
            <div>• Cadastral Survey / Gat No.</div>
            <div>• Khatedar / Grantee Identity</div>
            <div>• Normalized Plot Area</div>
            <div>• Devanagari / English Transliteration</div>
          </div>
        </div>

      </div>
    </PortalLayout>
  );
};
