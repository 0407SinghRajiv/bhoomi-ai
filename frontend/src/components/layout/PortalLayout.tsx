import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User,
  Shield,
  UploadCloud,
  FileText,
  GitCompare,
  Inbox,
  ArrowLeft,
  ArrowRightLeft,
  Info,
  Eye,
  Layers,
  Menu,
  X,
  Home
} from 'lucide-react';
import { StateSelector } from '../common/StateSelector';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAppState } from '../../context/AppStateContext';

interface PortalLayoutProps {
  children: React.ReactNode;
  portalType: 'citizen' | 'authority';
  title: string;
  subtitle?: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  portalType,
  title,
  subtitle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const { selectedState, t } = useAppState();

  const isCitizen = portalType === 'citizen';

  const citizenNav = [
    { name: t('dashboard'), path: '/citizen', icon: User },
    { name: t('my_land'), path: '/citizen/land', icon: Layers },
    { name: t('upload_documents'), path: '/citizen/upload', icon: UploadCloud },
    { name: t('my_documents'), path: '/citizen/documents', icon: FileText },
    { name: t('reconciliation'), path: '/citizen/analysis', icon: GitCompare },
    { name: t('evidence_viewer'), path: '/citizen/evidence', icon: Eye },
  ];

  const authorityNav = [
    { name: t('command_center'), path: '/authority', icon: Shield },
    { name: t('document_repository'), path: '/authority/documents', icon: FileText },
    { name: t('verification_queue'), path: '/authority/cases', icon: Inbox },
    { name: t('cadastral_gis'), path: '/authority/gis', icon: Layers },
    { name: t('access_requests'), path: '/authority/access-requests', icon: User },
  ];

  const navItems = isCitizen ? citizenNav : authorityNav;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Main Portal Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Brand & Portal Type */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link to="/" className="flex items-center gap-2 group shrink-0" title="Return to Landing Page">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center font-mono font-bold text-blue-600 group-hover:border-blue-500 transition shadow-sm">
                  <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition" />
                </div>
                <span className="font-bold text-base text-slate-900 tracking-tight hidden sm:inline">
                  {t('app_name')}
                </span>
              </Link>

              <span className="text-slate-300 hidden sm:inline">/</span>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                  isCitizen
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  {isCitizen ? <User className="w-3.5 h-3.5 shrink-0" /> : <Shield className="w-3.5 h-3.5 shrink-0" />}
                  <span className="whitespace-nowrap">{isCitizen ? t('citizen_portal') : t('authority_portal')}</span>
                </div>
              </div>
            </div>

            {/* Middle Nav Items (Desktop only - xl) */}
            <nav className="hidden xl:flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? isCitizen
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls: Desktop */}
            <div className="hidden xl:flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageSelector variant="compact" />
              <StateSelector variant="compact" />

              {/* Role Switcher */}
              <Link
                to={isCitizen ? '/authority' : '/citizen'}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition shrink-0"
                title={`Switch to ${isCitizen ? 'Authority' : 'Citizen'} view`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>
                  {isCitizen ? t('switch_to_authority') : t('switch_to_citizen')}
                </span>
              </Link>
            </div>

            {/* Mobile / Tablet Controls & Hamburger Button */}
            <div className="flex items-center gap-2 xl:hidden shrink-0">
              <LanguageSelector variant="compact" />
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-xs transition"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-slate-800" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-800" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Full-Featured Hamburger Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white shadow-xl animate-fadeIn">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              
              {/* Context Selector in Mobile Menu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Revenue Jurisdiction
                  </span>
                  <StateSelector variant="hero" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Preferred Language
                  </span>
                  <LanguageSelector variant="hero" />
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
                  {isCitizen ? 'Citizen Navigation' : 'Authority Workbench Navigation'}
                </span>
                <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? isCitizen
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Switcher & Home Actions */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link
                  to={isCitizen ? '/authority' : '/citizen'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                >
                  <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                  <span>
                    {isCitizen ? t('switch_to_authority') : t('switch_to_citizen')}
                  </span>
                </Link>

                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                >
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>Return to Home</span>
                </Link>
              </div>

            </div>
          </div>
        )}
      </header>

      {/* Portal Breadcrumbs / Page Title Header */}
      <div className="border-b border-slate-200 bg-white py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>{t('jurisdiction')}:</span>
              <span className="text-blue-700 font-bold">{selectedState}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{t('live_workspace')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 shadow-sm">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{t('platform_active')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Portal Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};
