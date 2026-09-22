import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Eye,
  AlertCircle,
  Database
} from 'lucide-react';
import { PortalLayout } from '../../components/layout/PortalLayout';
import { useAppState } from '../../context/AppStateContext';
import { api } from '../../services/api';
import { getFallbackDocumentDataUri } from '../../utils/documentFallbackImages';
import type { DocumentProcessingStatusResponse } from '../../services/api';

interface UploadSlotState {
  file: File | null;
  error: string | null;
}

export const CitizenUpload: React.FC = () => {
  const { selectedState, stateMetadata } = useAppState();

  const [saleDeedSlot, setSaleDeedSlot] = useState<UploadSlotState>({ file: null, error: null });
  const [mutationSlot, setMutationSlot] = useState<UploadSlotState>({ file: null, error: null });
  const [rorSlot, setRorSlot] = useState<UploadSlotState>({ file: null, error: null });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [currentStepMessage, setCurrentStepMessage] = useState<string>('');
  const [processedResults, setProcessedResults] = useState<DocumentProcessingStatusResponse[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const currentRorName = stateMetadata.commonDocuments[0] || 'Record of Rights (7/12 / RTC / Khatauni)';
  const currentMutationName = stateMetadata.commonDocuments[2] || 'Mutation Entry (Ferfar / MR)';

  const validateAndSetFile = (
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<UploadSlotState>>
  ) => {
    if (!file) {
      setter({ file: null, error: null });
      return;
    }

    if (file.size === 0) {
      setter({ file: null, error: 'File is empty (0 bytes). Please select a valid document.' });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setter({ file: null, error: 'File exceeds 25MB maximum limit.' });
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'tif'];
    if (!ext || !validExts.includes(ext)) {
      setter({ file: null, error: `Invalid format .${ext}. Allowed: PDF, PNG, JPG, TIFF.` });
      return;
    }

    setter({ file, error: null });
  };

  const handleRunPipeline = async () => {
    const slotsToUpload = [
      { slot: saleDeedSlot, docTypeName: 'Sale Deed', defaultTypeId: 8 },
      { slot: mutationSlot, docTypeName: currentMutationName, defaultTypeId: 3 },
      { slot: rorSlot, docTypeName: currentRorName, defaultTypeId: 1 },
    ].filter((s) => s.slot.file !== null);

    if (slotsToUpload.length === 0) {
      alert('Please select at least one document to process.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);
    setProcessedResults([]);
    setPipelineProgress(10);
    setCurrentStepMessage('Validating files and establishing database records...');

    const results: DocumentProcessingStatusResponse[] = [];

    try {
      for (let i = 0; i < slotsToUpload.length; i++) {
        const item = slotsToUpload[i];
        const file = item.slot.file!;

        setPipelineProgress(20 + i * 25);
        setCurrentStepMessage(`Uploading and splitting pages: ${file.name}...`);

        const uploadRes = await api.uploadDocument(file, {
          demo_owner_type: 'DEMO_CITIZEN',
        });

        setPipelineProgress(40 + i * 25);
        setCurrentStepMessage(`Running Quality Gate & Multilingual OCR on ${file.name}...`);

        const statusRes = await api.getDocumentStatus(uploadRes.document_id);
        results.push(statusRes);
      }

      setPipelineProgress(100);
      setCurrentStepMessage('Ingestion, Quality Gate analysis, and OCR complete!');
      setProcessedResults(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pipeline execution failed';
      setGlobalError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasAnyFile = saleDeedSlot.file || mutationSlot.file || rorSlot.file;

  return (
    <PortalLayout
      portalType="citizen"
      title="Multi-Document Land Record Ingestion"
      subtitle="Upload the primary triad of records required for cross-document reconciliation and validation."
    >
      <div className="space-y-8 max-w-5xl">
        
        {/* Step 1 Guided Journey Banner for Rural Citizens */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-blue-700">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold">
                STEP 1 OF 3
              </span>
              <span>Land Record Document Upload • {selectedState}</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Direct Ingestion for Farmers & Landowners
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please upload your registered land papers below. BhoomiAI automatically analyzes document clarity, extracts owner names, survey numbers, and coordinates across Marathi, Hindi, and English.
          </p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* 3 Document Upload Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Document 1: Sale Deed */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                  DOC 01 • PRIMARY
                </span>
                <span className="text-xs font-semibold text-blue-600">Conveyance</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Registered Sale Deed</h3>
              <div className="text-[11px] font-medium text-blue-700">खरेदी खत / बैनामा / Registry</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registered conveyancing deed bearing Sub-Registrar stamp, consideration value, and schedule of property.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center space-y-2 transition bg-slate-50/80">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 truncate" title={saleDeedSlot.file?.name}>
                {saleDeedSlot.file ? saleDeedSlot.file.name : 'Select or drop PDF / Scan'}
              </div>
              <div className="text-[11px] text-slate-500">PDF, PNG, JPG, TIFF up to 25MB</div>
              {saleDeedSlot.error && (
                <div className="text-[11px] text-rose-600 font-medium">{saleDeedSlot.error}</div>
              )}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
                className="hidden"
                id="sale-deed-upload"
                onChange={(e) => validateAndSetFile(e.target.files?.[0] || null, setSaleDeedSlot)}
              />
              <div className="pt-2 flex items-center justify-center gap-2">
                <label
                  htmlFor="sale-deed-upload"
                  className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm cursor-pointer"
                >
                  Browse
                </label>
                {saleDeedSlot.file && (
                  <button
                    type="button"
                    onClick={() => setSaleDeedSlot({ file: null, error: null })}
                    className="text-[11px] text-slate-500 hover:text-rose-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document 2: Mutation Record */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700">
                  DOC 02 • MUTATION
                </span>
                <span className="text-xs font-semibold text-indigo-600">Register</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{currentMutationName}</h3>
              <div className="text-[11px] font-medium text-indigo-700">फेरफार नोंद / नामांतरण / दाखिल खारिज</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mutation register entry documenting title transition, notice period, and Tehsildar approval.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center space-y-2 transition bg-slate-50/80">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 truncate" title={mutationSlot.file?.name}>
                {mutationSlot.file ? mutationSlot.file.name : 'Select or drop PDF / Scan'}
              </div>
              <div className="text-[11px] text-slate-500">PDF, PNG, JPG, TIFF up to 25MB</div>
              {mutationSlot.error && (
                <div className="text-[11px] text-rose-600 font-medium">{mutationSlot.error}</div>
              )}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
                className="hidden"
                id="mutation-upload"
                onChange={(e) => validateAndSetFile(e.target.files?.[0] || null, setMutationSlot)}
              />
              <div className="pt-2 flex items-center justify-center gap-2">
                <label
                  htmlFor="mutation-upload"
                  className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm cursor-pointer"
                >
                  Browse
                </label>
                {mutationSlot.file && (
                  <button
                    type="button"
                    onClick={() => setMutationSlot({ file: null, error: null })}
                    className="text-[11px] text-slate-500 hover:text-rose-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document 3: Current Record of Rights */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700">
                  DOC 03 • ACTIVE ROR
                </span>
                <span className="text-xs font-semibold text-cyan-600">Extract</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{currentRorName}</h3>
              <div className="text-[11px] font-medium text-cyan-700">७/१२ उतारा / खतौनी / पट्टा / RTC</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Active revenue extract showing current recorded khatedar, survey number, and recorded area.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-xl p-6 text-center space-y-2 transition bg-slate-50/80">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 truncate" title={rorSlot.file?.name}>
                {rorSlot.file ? rorSlot.file.name : 'Select or drop PDF / Scan'}
              </div>
              <div className="text-[11px] text-slate-500">PDF, PNG, JPG, TIFF up to 25MB</div>
              {rorSlot.error && (
                <div className="text-[11px] text-rose-600 font-medium">{rorSlot.error}</div>
              )}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif"
                className="hidden"
                id="ror-upload"
                onChange={(e) => validateAndSetFile(e.target.files?.[0] || null, setRorSlot)}
              />
              <div className="pt-2 flex items-center justify-center gap-2">
                <label
                  htmlFor="ror-upload"
                  className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm cursor-pointer"
                >
                  Browse
                </label>
                {rorSlot.file && (
                  <button
                    type="button"
                    onClick={() => setRorSlot({ file: null, error: null })}
                    className="text-[11px] text-slate-500 hover:text-rose-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Action Trigger Card with Live Progress Bar */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">
                Ready for Document Ingestion & Quality Analysis
              </div>
              <div className="text-xs text-slate-500">
                Executes pre-OCR quality evaluation, language detection, and coordinate bounding-box extraction.
              </div>
            </div>

            <button
              onClick={handleRunPipeline}
              disabled={!hasAnyFile || isProcessing}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-bold shadow-sm transition ${
                hasAnyFile && !isProcessing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-blue-600/20'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Pipeline & Extract OCR</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Real Animated Progress Bar */}
          {isProcessing && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-600">
                <span className="font-semibold text-blue-700">{currentStepMessage}</span>
                <span>{pipelineProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${pipelineProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Phase 3 Live OCR & Quality Gate Results Viewer */}
        {processedResults.length > 0 && (
          <div className="space-y-6 pt-2">
            
            {/* Direct 3-Step Continuation Banner */}
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-950">
                    Documents Successfully Ingested & Parsed ({processedResults.length} records)
                  </span>
                </div>
                <p className="text-xs text-emerald-800">
                  Your land papers are verified. Choose your next step to inspect your spatial map or verify cross-record matching:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <Link
                  to="/citizen/land"
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition shadow-xs"
                >
                  <span>Step 2: Inspect My Land & GIS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to={`/citizen/analysis?doc_ids=${processedResults.map((r) => r.document_id).join(',')}`}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition shadow-xs"
                >
                  <span>Step 3: Run Conflict Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Extraction & Quality Details
                </h3>
              </div>
              <Link
                to="/citizen/documents"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>View All In Document Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-6">
              {processedResults.map((docResult) => (
                <div
                  key={docResult.document_id}
                  className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden"
                >
                  {/* Result Header */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{docResult.file_name}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>Pages: {docResult.page_count}</span>
                          <span>•</span>
                          <span>Detected Language: <strong className="text-slate-700 uppercase font-mono">{docResult.detected_language}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md border ${
                          docResult.quality_status === 'GOOD'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : docResult.quality_status === 'ACCEPTABLE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : docResult.quality_status === 'POOR'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        Quality: {docResult.quality_status}
                      </span>

                      <Link
                        to={`/citizen/documents/${docResult.document_id}/extraction`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Structured Fields</span>
                      </Link>
                    </div>
                  </div>

                  {/* Quality Gate Metrics & Pages */}
                  <div className="p-5 space-y-6">
                    {docResult.pages.map((page) => (
                      <div key={page.page_number} className="space-y-4">
                        
                        {/* Advisory Warning if POOR */}
                        {page.quality.advisory_message && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2 shadow-sm">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span><strong>Quality Gate Warning:</strong> {page.quality.advisory_message}</span>
                          </div>
                        )}

                        {/* Quality Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <span className="text-[11px] font-mono text-slate-500 block">Sharpness / Blur</span>
                            <span className="font-bold text-slate-800">{page.quality.blur_score}</span>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <span className="text-[11px] font-mono text-slate-500 block">Contrast (RMS)</span>
                            <span className="font-bold text-slate-800">{page.quality.contrast_score}</span>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <span className="text-[11px] font-mono text-slate-500 block">Skew Angle</span>
                            <span className="font-bold text-slate-800">{page.quality.skew_angle}°</span>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                            <span className="text-[11px] font-mono text-slate-500 block">Resolution</span>
                            <span className="font-bold text-slate-800">{page.quality.width} × {page.quality.height} px</span>
                          </div>
                        </div>

                        {/* Extracted Text & Bounding Evidence */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Left: OCR Text Viewport */}
                          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/70">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="text-xs font-bold text-slate-800 font-mono">
                                OCR Text Extracted (Page {page.page_number})
                              </span>
                              <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                                Conf: {(page.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed bg-white p-3 rounded border border-slate-200">
                              {page.text || 'No text extracted.'}
                            </pre>
                          </div>

                          {/* Right: Rendered Page Preview with Coordinate Details */}
                          <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/70">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Rendered Viewport Preview</span>
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                {page.bounding_boxes.length} Bounding Regions
                              </span>
                            </div>

                            <div className="h-52 bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center relative">
                              <img
                                src={api.getPageImageUrl(docResult.document_id, page.page_number)}
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const fallback = getFallbackDocumentDataUri(docResult.document_id, page.page_number);
                                  if (target.src !== fallback) {
                                    target.src = fallback;
                                  }
                                }}
                                alt={`Page ${page.page_number}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </div>

                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
};
