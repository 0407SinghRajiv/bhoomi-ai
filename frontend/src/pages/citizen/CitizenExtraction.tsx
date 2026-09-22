import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  MapPin,
  Calendar,
  Layers,
  Crosshair,
  User,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { api } from '../../services/api';
import { getFallbackDocumentDataUri } from '../../utils/documentFallbackImages';
import type { ApiDocumentExtractionResponse, ApiExtractedFieldItem } from '../../services/api';

export const CitizenExtraction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id || '1', 10);

  const [extraction, setExtraction] = useState<ApiDocumentExtractionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReextracting, setIsReextracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Evidence Viewer Selection
  const [selectedField, setSelectedField] = useState<ApiExtractedFieldItem | null>(null);

  const fetchExtractions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDocumentExtractions(documentId);
      setExtraction(data);
      // Default select the first non-missing field
      const firstActive = data.fields.find((f) => f.status !== 'MISSING') || data.fields[0];
      if (firstActive) {
        setSelectedField(firstActive);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load extraction details';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtractions();
  }, [documentId]);

  const handleReextract = async () => {
    setIsReextracting(true);
    try {
      const refreshed = await api.reextractDocument(documentId);
      setExtraction(refreshed);
      const firstActive = refreshed.fields.find((f) => f.status !== 'MISSING') || refreshed.fields[0];
      if (firstActive) {
        setSelectedField(firstActive);
      }
    } catch (err: unknown) {
      alert('Re-extraction failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsReextracting(false);
    }
  };

  const formatFieldName = (key: string): string => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFieldIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('owner') || lower.includes('seller') || lower.includes('buyer')) {
      return <User className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (lower.includes('number') || lower.includes('gat') || lower.includes('survey') || lower.includes('khasra')) {
      return <Hash className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (lower.includes('village') || lower.includes('taluka') || lower.includes('district') || lower.includes('state')) {
      return <MapPin className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (lower.includes('date')) {
      return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
    }
    return <Layers className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'EXTRACTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            EXTRACTED
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3" />
            VERIFIED
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            NEEDS REVIEW
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <HelpCircle className="w-3 h-3" />
            MISSING
          </span>
        );
    }
  };

  const fields = extraction?.fields || [];

  const filteredFields = fields.filter((f) => {
    const matchesSearch =
      f.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.normalized_value && f.normalized_value.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.raw_value && f.raw_value.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'EXTRACTED') return matchesSearch && (f.status === 'EXTRACTED' || f.status === 'VERIFIED');
    if (statusFilter === 'NEEDS_REVIEW') return matchesSearch && f.status === 'NEEDS_REVIEW';
    if (statusFilter === 'MISSING') return matchesSearch && f.status === 'MISSING';
    return matchesSearch;
  });

  const extractedCount = fields.filter((f) => f.status === 'EXTRACTED' || f.status === 'VERIFIED').length;
  const missingCount = fields.filter((f) => f.status === 'MISSING').length;
  const reviewCount = fields.filter((f) => f.status === 'NEEDS_REVIEW').length;
  const avgConfidence =
    extractedCount > 0
      ? Math.round(
          (fields
            .filter((f) => f.status !== 'MISSING')
            .reduce((acc, curr) => acc + (curr.confidence || 0), 0) /
            (extractedCount + reviewCount || 1)) *
            100
        )
      : 0;

  // Coordinate normalizer for Bounding Box rendering
  // Bounding box format: [ymin, xmin, ymax, xmax] normalized (0 to 1)
  const renderBoundingOverlay = () => {
    if (!selectedField || !selectedField.bounding_box || selectedField.bounding_box.length < 4) {
      return null;
    }
    const [c1, c2, c3, c4] = selectedField.bounding_box;
    // Normalized percentages:
    const top = `${Math.min(c1, c3) * 100}%`;
    const left = `${Math.min(c2, c4) * 100}%`;
    const height = `${Math.abs(c3 - c1) * 100}%`;
    const width = `${Math.abs(c4 - c2) * 100}%`;

    return (
      <div
        className="absolute border-2 border-amber-500 bg-amber-400/20 rounded shadow-lg transition-all duration-300 pointer-events-none animate-pulse"
        style={{ top, left, width, height }}
      >
        <span className="absolute -top-6 left-0 bg-amber-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap">
          {formatFieldName(selectedField.field_name)}
        </span>
      </div>
    );
  };

  return (
    <PortalLayout
      portalType="citizen"
      title="Structured Land Record Extraction"
      subtitle="Cadastral entity extraction powered by layout OCR, multi-script normalization, and verifiable evidence tracing."
    >
      <div className="space-y-6">

        {/* Back Link & Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/citizen/documents"
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 shadow-sm transition"
              title="Back to Documents"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {extraction?.file_name || `Document #${documentId}`}
                </h2>
                {extraction?.document_type_name && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Auto-Detected: {extraction.document_type_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configurable cadastral extraction engine • Script: Devanagari / Latin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleReextract}
              disabled={isReextracting || isLoading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReextracting ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isReextracting ? 'Re-extracting...' : 'Re-run Extraction'}</span>
            </button>

            <Link
              to={`/citizen/analysis`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Proceed to Triad Analysis</span>
            </Link>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Extracted Fields</span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-2">
              <span>{extractedCount}</span>
              <span className="text-xs text-slate-400 font-normal">/ {fields.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Confidence Avg</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {avgConfidence}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Auto Document Type</span>
            <div className="text-sm font-bold text-blue-700 mt-1 truncate" title={extraction?.document_type_name || 'Generic'}>
              {extraction?.document_type_code || 'DETECTING...'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Missing / Incomplete</span>
            <div className="text-xl font-bold text-slate-600 mt-1 flex items-baseline gap-2">
              <span>{missingCount}</span>
              <span className="text-xs text-slate-400 font-normal">unmatched</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="border border-slate-200 rounded-xl bg-white p-12 text-center text-xs text-slate-500 shadow-sm space-y-3">
            <div className="animate-spin w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="font-semibold text-slate-700">Loading structured extraction entities...</p>
            <p className="text-[11px] text-slate-400">Querying database indices and normalizer...</p>
          </div>
        )}

        {/* Main Content Area: 2 Column Layout (Table & Evidence Viewer) */}
        {!isLoading && extraction && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column (7 cols): Extraction Result Table */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Filter & Search Bar */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search fields, normalized values, or raw text..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {(['ALL', 'EXTRACTED', 'NEEDS_REVIEW', 'MISSING'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                          statusFilter === filter
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {filter === 'ALL'
                          ? `All (${fields.length})`
                          : filter === 'EXTRACTED'
                          ? `Extracted (${extractedCount})`
                          : filter === 'NEEDS_REVIEW'
                          ? `Review (${reviewCount})`
                          : `Missing (${missingCount})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extraction Table */}
              <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cadastral Fields Extraction Table ({filteredFields.length})
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Click row to inspect evidence
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 divide-y divide-slate-200">
                    <thead className="bg-slate-50/70 text-[11px] font-mono text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Field</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-3 py-3">Confidence</th>
                        <th className="px-3 py-3">Source</th>
                        <th className="px-3 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredFields.map((field) => {
                        const isSelected = selectedField?.field_name === field.field_name;
                        return (
                          <tr
                            key={field.field_name}
                            onClick={() => setSelectedField(field)}
                            className={`cursor-pointer transition select-none ${
                              isSelected
                                ? 'bg-blue-50/80 ring-1 ring-blue-500 font-medium'
                                : 'hover:bg-slate-50/60'
                            }`}
                          >
                            {/* 1. Field */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-slate-100 text-slate-600">
                                  {getFieldIcon(field.field_name)}
                                </div>
                                <span className="font-semibold text-slate-900">
                                  {formatFieldName(field.field_name)}
                                </span>
                              </div>
                            </td>

                            {/* 2. Value */}
                            <td className="px-4 py-3 max-w-xs">
                              {field.status === 'MISSING' || !field.normalized_value ? (
                                <span className="text-slate-400 italic text-[11px]">
                                  Not found in record
                                </span>
                              ) : (
                                <div>
                                  <div className="text-slate-900 font-medium break-words">
                                    {field.normalized_value}
                                  </div>
                                  {field.raw_value && field.raw_value !== field.normalized_value && (
                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                      Raw: <span className="text-slate-700">{field.raw_value}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* 3. Confidence */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {field.status === 'MISSING' ? (
                                <span className="text-slate-400 font-mono text-[11px]">—</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        field.confidence >= 0.85
                                          ? 'bg-emerald-500'
                                          : field.confidence >= 0.70
                                          ? 'bg-blue-500'
                                          : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${Math.round(field.confidence * 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[11px] font-semibold text-slate-700">
                                    {Math.round(field.confidence * 100)}%
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* 4. Source */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {field.status === 'MISSING' ? (
                                <span className="text-slate-400 font-mono text-[11px]">—</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  Page {field.page_number}
                                </span>
                              )}
                            </td>

                            {/* 5. Status */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {getStatusBadge(field.status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredFields.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No fields match your search or filter.
                  </div>
                )}
              </div>

            </div>

            {/* Right Column (5 cols): Evidence Viewer for Phase 5 Preparation */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4 sticky top-6">
                
                {/* Evidence Viewer Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Evidence Viewer (Phase 5 Prep)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    Reconciliation Link
                  </span>
                </div>

                {selectedField ? (
                  <div className="space-y-4">
                    
                    {/* Selected Field Badge */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                          Selected Cadastral Field
                        </span>
                        {getStatusBadge(selectedField.status)}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {formatFieldName(selectedField.field_name)}
                      </h4>
                    </div>

                    {/* Rendered Document Viewport with Bounding Box Overlay */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono text-[11px] flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          Document Page {selectedField.page_number} Viewport
                        </span>
                        {selectedField.bounding_box ? (
                          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Bounding Region Locked
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-400">
                            No coordinate box
                          </span>
                        )}
                      </div>

                      <div className="h-64 bg-slate-900 rounded-lg border border-slate-300 relative overflow-hidden flex items-center justify-center">
                        <img
                          src={api.getPageImageUrl(documentId, selectedField.page_number || 1)}
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = getFallbackDocumentDataUri(documentId, selectedField.page_number || 1);
                            if (target.src !== fallback) {
                              target.src = fallback;
                            }
                          }}
                          alt="Rendered Page Viewport"
                          className="max-h-full max-w-full object-contain select-none"
                        />
                        {renderBoundingOverlay()}
                      </div>
                    </div>

                    {/* Normalized & Raw Entity Comparison */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                        <span className="text-[11px] font-mono text-slate-500 block">
                          Normalized Value (Reconciliation Target):
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          {selectedField.normalized_value || 'None (Missing)'}
                        </span>

                        {selectedField.raw_value && (
                          <div className="pt-1.5 border-t border-slate-200">
                            <span className="text-[10px] font-mono text-slate-500 block">
                              Raw Value (OCR / Script Token):
                            </span>
                            <span className="font-mono text-slate-700 text-xs block">
                              {selectedField.raw_value}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Source Text Snippet */}
                      {selectedField.source_text && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[11px] font-mono text-slate-500 block">
                            Context Line (Layout Lineage):
                          </span>
                          <p className="text-xs text-slate-800 italic bg-white p-2 rounded border border-slate-200 font-mono">
                            "{selectedField.source_text}"
                          </p>
                        </div>
                      )}

                      {/* Extraction Confidence & Review Status */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-mono">Confidence</span>
                          <span className="font-bold text-emerald-700">
                            {Math.round(selectedField.confidence * 100)}%
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block font-mono">Review State</span>
                          <span className="font-bold text-slate-800">
                            {selectedField.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Phase 5 Readiness Box */}
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ready for Phase 5 Cross-Document Reconciliation</span>
                      </div>
                      <p className="text-[11px] text-blue-700 leading-relaxed">
                        Entity token registered with bounding box coordinates for click-to-highlight cross-examination across the Land Triad.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                    <Crosshair className="w-6 h-6 text-slate-300 mx-auto" />
                    <p>Select any field in the table to inspect its bounding coordinates and normalized entity lineage.</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

      </div>
    </PortalLayout>
  );
};
