import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Eye,
  FileText,
  Sparkles,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import type { ApiDocumentDetail } from '../../services/api';

interface OriginalDocumentViewerProps {
  documentId: number;
  initialPage?: number;
  highlightBox?: number[] | null; // [ymin, xmin, ymax, xmax] normalized 0-1 or pixel
  highlightFieldName?: string | null;
  onClose?: () => void;
  extractedFields?: any[];
}

export const OriginalDocumentViewer: React.FC<OriginalDocumentViewerProps> = ({
  documentId,
  initialPage = 1,
  highlightBox = null,
  highlightFieldName = null,
  onClose,
  extractedFields = [],
}) => {
  const [docDetail, setDocDetail] = useState<ApiDocumentDetail | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'IMAGE_SCAN' | 'PDF_NATIVE'>('IMAGE_SCAN');
  const [activeHighlight, setActiveHighlight] = useState<number[] | null>(highlightBox);
  const [activeFieldLabel, setActiveFieldLabel] = useState<string | null>(highlightFieldName);
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch document details on load
  useEffect(() => {
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (initialPage) setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    setActiveHighlight(highlightBox);
    setActiveFieldLabel(highlightFieldName);
  }, [highlightBox, highlightFieldName]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      const doc = await api.getDocument(documentId);
      setDocDetail(doc);
      if (doc.page_count && currentPage > doc.page_count) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to load document details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = docDetail?.page_count || 1;
  const isPdf = docDetail?.file_name.toLowerCase().endsWith('.pdf') ?? true;

  // Zoom controls
  const handleZoomIn = () => setZoomScale((z) => Math.min(z + 0.25, 3.0));
  const handleZoomOut = () => setZoomScale((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomScale(1.0);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  // Convert bounding box array [ymin, xmin, ymax, xmax] to CSS percentages
  const getBoxStyle = (box: number[]) => {
    if (!box || box.length < 4) return null;
    let [ymin, xmin, ymax, xmax] = box;

    // Check if coordinates are normalized (0-1) or absolute pixel
    if (ymin > 1 || xmin > 1 || ymax > 1 || xmax > 1) {
      // pixel coordinates normalize relative to standard A4 (2480 x 3508)
      const refW = 2480;
      const refH = 3508;
      return {
        top: `${(ymin / refH) * 100}%`,
        left: `${(xmin / refW) * 100}%`,
        height: `${((ymax - ymin) / refH) * 100}%`,
        width: `${((xmax - xmin) / refW) * 100}%`,
      };
    }

    return {
      top: `${ymin * 100}%`,
      left: `${xmin * 100}%`,
      height: `${(ymax - ymin) * 100}%`,
      width: `${(xmax - xmin) * 100}%`,
    };
  };

  const handleSelectField = (f: any) => {
    let box = null;
    if (f.bounding_box) {
      box = typeof f.bounding_box === 'string' ? JSON.parse(f.bounding_box) : f.bounding_box;
    }
    setActiveHighlight(box);
    setActiveFieldLabel(f.field_name || f.field_key);
    if (f.page_number) {
      setCurrentPage(f.page_number);
    }
    if (viewMode === 'PDF_NATIVE') {
      setViewMode('IMAGE_SCAN');
    }
  };

  const fileUrl = api.getDocumentFileUrl(documentId);
  const downloadUrl = api.getDocumentFileUrl(documentId, true);
  const pageImageUrl = `/api/documents/${documentId}/pages/${currentPage}/image`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden text-slate-100"
    >
      {/* Top Controls Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        {/* Left: Document Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
                {docDetail?.file_name || `Document #${documentId}`}
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                ORIGINAL SCAN
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>{docDetail?.document_type?.name || 'Land Title Record'}</span>
              <span>&bull;</span>
              <span>State: {docDetail?.state?.name || 'Maharashtra'}</span>
            </div>
          </div>
        </div>

        {/* Middle: Page & View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1">
          {/* Page Navigation */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold px-2 text-slate-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            title="Next Page"
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          {/* Zoom In / Out / Reset */}
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 min-w-[40px] text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Fit to Page / Reset"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            title="Rotate 90° Clockwise"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 transition"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Mode & Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher if PDF */}
          {isPdf && (
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setViewMode('IMAGE_SCAN')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  viewMode === 'IMAGE_SCAN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Authentic Scan</span>
              </button>
              <button
                onClick={() => setViewMode('PDF_NATIVE')}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  viewMode === 'PDF_NATIVE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Raw PDF</span>
              </button>
            </div>
          )}

          {/* Toggle Inspector Panel */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              showInspector
                ? 'bg-slate-800 text-blue-400 border-blue-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Evidence Inspector</span>
          </button>

          {/* Download Raw Document */}
          <a
            href={downloadUrl}
            download
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center"
            title="Download Original File"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-300 transition flex items-center ml-1"
              title="Close Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Document Viewport (Left) + Evidence Inspector (Right) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Document Viewport */}
        <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative select-none">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Loading authentic document scan...</span>
            </div>
          ) : viewMode === 'PDF_NATIVE' && isPdf ? (
            <iframe
              src={`${fileUrl}#page=${currentPage}&toolbar=1&navpanes=0`}
              title="Native PDF Document Viewer"
              className="w-full h-full rounded border border-slate-800 bg-white"
            />
          ) : (
            <div
              className="relative transition-transform duration-150 origin-center max-w-full"
              style={{
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
              }}
            >
              {/* Authentic Scanned Document Page Image */}
              <img
                src={pageImageUrl}
                alt={`Scanned Page ${currentPage}`}
                className="max-w-none shadow-2xl rounded border border-slate-700/80 bg-[#FAF7EF]"
                style={{ width: '850px', height: 'auto' }}
                onError={() => {
                  // If page image not rendered, fallback to raw PDF iframe
                  if (isPdf) setViewMode('PDF_NATIVE');
                }}
              />

              {/* OCR Evidence Bounding Box Highlight Overlay */}
              {activeHighlight && (
                <div
                  className="absolute pointer-events-none rounded transition-all duration-300 ring-4 ring-rose-500/80 bg-rose-500/20 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse"
                  style={getBoxStyle(activeHighlight) || {}}
                >
                  <div className="absolute -top-7 left-0 bg-rose-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1 uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{activeFieldLabel || 'Extracted Evidence'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Extracted Evidence Inspector Drawer */}
        {showInspector && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 shadow-2xl z-10">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Extracted Evidence Fields
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {extractedFields.length} Fields
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Visual Explainability Link
                </div>
                <p className="text-[11px] leading-relaxed">
                  Click any field below to navigate directly to its source page and highlight its bounding box on the original scan.
                </p>
              </div>

              {extractedFields.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No extracted fields loaded for this document.
                </div>
              ) : (
                extractedFields.map((f, idx) => {
                  const isSelected = activeFieldLabel === (f.field_name || f.field_key);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectField(f)}
                      className={`w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 group ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500/80 shadow-md ring-1 ring-rose-500/40'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          {f.field_name || f.field_key}
                        </span>
                        {f.confidence && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              f.confidence >= 0.95
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {Math.round(f.confidence * 100)}% Conf
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                        {f.normalized_value || f.raw_value || '—'}
                      </div>

                      {f.source_text && (
                        <div className="text-[10px] text-slate-400 italic bg-slate-900/90 rounded px-2 py-1 mt-1 border border-slate-800/80 truncate">
                          "{f.source_text}"
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-800/60">
                        <span>Page {f.page_number || 1}</span>
                        <span className="text-blue-400 group-hover:underline flex items-center gap-1 font-semibold">
                          View on Document &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
