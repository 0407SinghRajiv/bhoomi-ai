import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Globe2,
  ShieldAlert,
  ArrowRight,
  Database,
  Eye,
  FileCheck,
  Building2,
  Users,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { StateSelector } from '../components/common/StateSelector';
import { useAppState } from '../context/AppStateContext';

export const LandingPage: React.FC = () => {
  const { selectedState, stateMetadata } = useAppState();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 bg-white bg-tech-grid">
          {/* Subtle Ambient Light Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-100/60 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              
              {/* Civic Tag Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono font-semibold tracking-wide shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>Enterprise Land Intelligence Platform</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700">Intelligent Land Record Digitization</span>
              </div>

              {/* Hero Title */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 uppercase leading-[1.08]">
                Digitize. Compare. <br />
                <span className="text-blue-600">
                  Verify.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-2xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
                AI-powered land record intelligence for citizens and authorities.
              </p>

              {/* Explanatory Pipeline Summary */}
              <div className="pt-2 pb-4">
                <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 shadow-md">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Upload records
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-indigo-600" /> Extract information
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <GitCompare className="w-4 h-4 text-cyan-600" /> Compare documents
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Identify inconsistencies
                  </span>
                  <span className="text-slate-300">→</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" /> Review evidence
                  </span>
                </div>
              </div>

              {/* State Selector */}
              <div className="max-w-md mx-auto pt-2">
                <StateSelector variant="hero" />
                <div className="mt-2 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <span>Selected: <strong className="text-blue-700">{selectedState}</strong></span>
                  <span>•</span>
                  <span>Typical: {stateMetadata.commonDocuments.slice(0, 2).join(', ')}</span>
                </div>
              </div>

              {/* One-Click Direct Portal CTAs (NO AUTH) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to="/citizen"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-md transition hover:border-slate-400"
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Open Citizen Portal</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </Link>

                <Link
                  to="/authority"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 border border-blue-600 transition"
                >
                  <Building2 className="w-5 h-5 text-white" />
                  <span>Open Authority Portal</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              </div>

              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Instant Access Portal • No signup or OTP required
              </div>

            </div>
          </div>
        </section>


        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="py-20 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
                Document Intelligence Pipeline
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 uppercase">
                How BhoomiAI Works
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                From physical paper or PDF to evidence-linked verification in four deliberate stages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Step 1 */}
              <div className="relative p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 text-blue-700 font-mono font-bold text-lg">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Upload</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Citizen or registrar uploads multi-page PDFs or scans: Registered Sale Deed, Mutation Register (Ferfar/MR), and Current Record of Rights (7/12, RTC, Khatauni).
                </p>
                <div className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-medium">
                  Pan-India document formats
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-4 text-indigo-700 font-mono font-bold text-lg">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Understand</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Multilingual OCR processes Devanagari and English text. Information extraction isolates owners, survey numbers, plot areas, dates, and covenants.
                </p>
                <div className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 font-medium">
                  Multilingual NER & Units
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-4 text-cyan-700 font-mono font-bold text-lg">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Compare</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Reconciliation engine correlates documents chronologically. It compares seller-buyer continuity, plot area deltas, and survey subdivisions.
                </p>
                <div className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded border border-cyan-200 font-medium">
                  Area & owner normalization
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-700 font-mono font-bold text-lg">
                  04
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Verify</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Every conflict is linked directly to visual bounding evidence. Revenue officers adjudicate flagged anomalies with an immutable audit log.
                </p>
                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-medium">
                  Evidence-backed adjudication
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ================= CORE FEATURES ================= */}
        <section id="features" className="py-20 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
                Technical Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 uppercase">
                Engineered for High-Stakes Land Records
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Purpose-built intelligence to solve the unique complexities of Indian cadastral and land tenure systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm">
                <Globe2 className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900 mb-2">Multilingual OCR</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deep learning text recognition tailored for English, Hindi, and Marathi official government land stamps, signatures, and revenue terminology.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm">
                <FileCheck className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900 mb-2">Structured Extraction</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatic extraction of key entities: survey numbers, Gat numbers, Khasra/Khatauni IDs, owner shares, transaction consideration, and dates.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm">
                <Layers className="w-8 h-8 text-cyan-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900 mb-2">Cross-Document Reconciliation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Not just parsing single pages—BhoomiAI matches the Sale Deed against the Mutation Register and RoR to verify title transfer continuity.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900 mb-2">Evidence-Linked Conflicts</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When a discrepancy is flagged, the platform pinpoints the exact line and page in both documents side-by-side with confidence metrics.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm">
                <Fingerprint className="w-8 h-8 text-emerald-600 mb-4" />
                <h3 className="text-base font-bold text-slate-900 mb-2">Confidence Scoring</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Transparent reliability metrics based on OCR clarity, entity completeness, and historical continuity without false claims of legal certification.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm">
                <Building2 className="w-8 h-8 text-blue-700 mb-4" />
                <h3 className="text-base font-bold text-slate-900 mb-2">Authority Verification Queue</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dedicated portal for Talathi, Tehsildar, or Revenue Officers to review flagged risks, view citations, request clarifications, or approve.
                </p>
              </div>

              {/* Feature 7 */}
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition shadow-sm md:col-span-2 lg:col-span-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Database className="w-8 h-8 text-indigo-600 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">GIS-Ready Spatial Architecture</h3>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                        Designed with PostGIS schema compatibility to ingest parcel polygon boundaries, cadastral map overlays, and geo-referenced survey coordinates.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold whitespace-nowrap">
                    PostGIS Schema Ready
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ================= CITIZEN VS AUTHORITY BENEFITS ================= */}
        <section className="py-20 border-b border-slate-200 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
                Stakeholder Value
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 uppercase">
                Solving Dual Realities in Land Administration
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Citizen Card */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">For Citizens & Land Buyers</h3>
                      <p className="text-xs text-slate-500">Due diligence, clarity & transparency</p>
                    </div>
                  </div>
                  <Link
                    to="/citizen"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    Open Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Pre-Purchase Discrepancy Checks:</strong> Detect area mismatches between Sale Deed and current 7/12 / RTC before committing funds.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Unit Conversion Clarity:</strong> Automated normalization across Guntha, Hectare, Bigha, Acre, and Sq. Feet.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Mutation Timeline Visibility:</strong> Follow how title moved across historical mutation entries without deciphering archaic revenue scripts alone.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Direct Case Submission:</strong> Submit highlighted discrepancies directly to the local revenue authority for formal resolution.</span>
                  </li>
                </ul>
              </div>

              {/* Authority Card */}
              <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-md space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">For Revenue Authorities</h3>
                      <p className="text-xs text-slate-500">Talathi, Tehsildar & Sub-Registrars</p>
                    </div>
                  </div>
                  <Link
                    to="/authority"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    Open Portal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Risk-Prioritized Triage:</strong> Cases automatically triaged by risk severity (Critical area mismatch vs. minor typographical variance).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Side-by-Side Visual Citations:</strong> Instant verification with OCR bounding boxes over uploaded deeds and extracts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Accelerated Mutation Approvals:</strong> Cut processing backlog by focusing officer attention strictly on conflicting attributes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>Tamper-Evident Audit Trail:</strong> Every action, note, and verification resolution is logged with officer identity and timestamp.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>


        {/* ================= SUPPORTED DOCUMENT TAXONOMY ================= */}
        <section className="py-20 border-b border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-600 font-bold">
                Pan-India Extensibility
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 uppercase">
                Supported Land Document Types
              </h2>
              <p className="text-slate-600 text-sm sm:text-base">
                Configurable schema supporting state-specific nomenclature and document formats.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-xs font-mono text-blue-700 font-bold block mb-1">MAHARASHTRA</span>
                <h4 className="text-sm font-bold text-slate-900 mb-2">7/12, 8A & Ferfar</h4>
                <p className="text-xs text-slate-600">Village Form VII-XII (Saat-Baara), Khata 8A, and Form 6 Mutation (Ferfar) extracts in Marathi & English.</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-xs font-mono text-indigo-700 font-bold block mb-1">KARNATAKA</span>
                <h4 className="text-sm font-bold text-slate-900 mb-2">RTC (Pahani) & MR</h4>
                <p className="text-xs text-slate-600">Bhoomi RTC extracts, Mutation Register (MR) orders, Form 9/11 rural property cards in Kannada & English.</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-xs font-mono text-cyan-700 font-bold block mb-1">UTTAR PRADESH</span>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Khatauni & Khasra</h4>
                <p className="text-xs text-slate-600">UP Bhulekh Khatauni (RoR), Khasra mapping references, and mutation status sheets in Hindi & English.</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                <span className="text-xs font-mono text-emerald-700 font-bold block mb-1">PAN-INDIA</span>
                <h4 className="text-sm font-bold text-slate-900 mb-2">Registered Sale Deeds</h4>
                <p className="text-xs text-slate-600">Sub-Registrar conveyancing deeds, partition deeds, gift deeds, and encumbrance certificates.</p>
              </div>

            </div>

            <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 shadow-sm">
              Active configuration loaded for <strong className="text-blue-700">{selectedState}</strong>. Architecture accommodates Jamabandi (RJ/HR/PB), Patta Chitta (TN), Dharani (TS), and Banglarbhumi (WB).
            </div>
          </div>
        </section>


        {/* ================= SECURITY & PRIVACY STATEMENT ================= */}
        <section id="about" className="py-20 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Security, Privacy & Responsible AI Statement
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-700 leading-relaxed">
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">AI Assistance, Not Legal Certification</h4>
                  <p className="text-slate-600">
                    BhoomiAI is strictly an intelligent decision-support platform designed to highlight textual, numerical, and structural discrepancies between documents. It never claims legal title ownership guarantee or official certification unless enacted by an authorized revenue magistrate.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">Strict Data Boundaries</h4>
                  <p className="text-slate-600">
                    All document scans uploaded to the platform are treated with strict confidentiality. PII entities (Aadhaar, contact details) are masked during extraction pipelines to uphold citizen privacy principles.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">Zero Fake Data Claims</h4>
                  <p className="text-slate-600">
                    We maintain strict technical truthfulness. Where live government APIs (e.g. CORD, Bhulekh, Bhoomi) are unavailable, the platform processes provided files locally rather than fabricating simulated responses.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">Tamper-Proof Audit Logging</h4>
                  <p className="text-slate-600">
                    Every authority review decision, resolution note, and risk status transition is captured in an append-only audit trail with UTC timestamps for accountability.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-mono text-slate-500 font-medium">
                  BhoomiAI Enterprise Platform
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to="/citizen"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition"
                  >
                    Enter Citizen Portal
                  </Link>
                  <Link
                    to="/authority"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                  >
                    Enter Authority Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};
