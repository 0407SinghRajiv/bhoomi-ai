import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Layers, Scale, AlertCircle } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

export const Footer: React.FC = () => {
  const { selectedState } = useAppState();

  return (
    <footer className="border-t border-slate-200 bg-slate-100 text-slate-600 text-sm">
      {/* Disclaimer Banner */}
      <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="font-semibold text-amber-900">Legal & Technical Transparency Notice:</strong> BhoomiAI provides AI-assisted document comparison and conflict highlighting. It does not perform legal title certification, official government verification, or biometric identity guarantees.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-mono font-bold text-white text-base shadow-sm">
                B
              </div>
              <span className="font-bold text-lg text-slate-900">
                Bhoomi<span className="text-blue-600">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI-Powered Land Record Intelligence and Validation Platform.
            </p>
            <div className="text-xs font-mono text-slate-500">
              Active State: <span className="text-blue-700 font-semibold">{selectedState}</span>
            </div>
          </div>

          {/* Col 2: Portals & Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">
              Platform Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/citizen" className="hover:text-blue-600 transition flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Citizen Portal (Upload & Verify)
                </Link>
              </li>
              <li>
                <Link to="/authority" className="hover:text-blue-600 transition flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  Authority Portal (Review & Adjudicate)
                </Link>
              </li>
              <li>
                <Link to="/citizen/documents" className="hover:text-slate-900 transition text-slate-600">
                  Document Repository
                </Link>
              </li>
              <li>
                <Link to="/authority/cases" className="hover:text-slate-900 transition text-slate-600">
                  Verification Queue
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Supported Formats */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">
              Pan-India Formats
            </h4>
            <ul className="space-y-1 text-xs text-slate-600 font-mono">
              <li>• Maharashtra: 7/12, 8A, Ferfar</li>
              <li>• Karnataka: RTC (Pahani), MR</li>
              <li>• Uttar Pradesh: Khatauni, Khasra</li>
              <li>• Telangana: Dharani, ROR-1B</li>
              <li>• Pan-India: Registered Sale Deeds</li>
            </ul>
          </div>

          {/* Col 4: Platform Security & Integrity */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">
              Integrity Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-700 font-medium">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Zero-Trust Evidence Citation</span>
              </li>
              <li className="flex items-center gap-2 text-slate-700 font-medium">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cross-Document Reconciliation</span>
              </li>
              <li className="flex items-center gap-2 text-slate-700 font-medium">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                <span>Tamper-Evident Audit Trails</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            BhoomiAI Platform • Team SynapseSix
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium">v1.0.0</span>
            <span>•</span>
            <span className="text-slate-500 font-medium">PostGIS Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
