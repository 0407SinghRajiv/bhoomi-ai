import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Shield, Menu, X } from 'lucide-react';
import { StateSelector } from '../common/StateSelector';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAppState } from '../../context/AppStateContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useAppState();

  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 p-0.5 shadow-md group-hover:bg-blue-700 transition">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <span className="font-mono font-black text-xl text-blue-600">B</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                  {t('app_name')}
                </span>
                <span className="text-[10px] tracking-wider uppercase text-slate-500 font-mono -mt-1 hidden sm:inline">
                  {t('app_subtitle')}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link to="/" className={`hover:text-blue-600 transition ${isHome ? 'text-blue-600 font-bold' : ''}`}>
              {t('home')}
            </Link>
            <a href="#how-it-works" className="hover:text-blue-600 transition">
              {t('how_it_works')}
            </a>
            <a href="#features" className="hover:text-blue-600 transition">
              {t('features')}
            </a>
            <a href="#about" className="hover:text-blue-600 transition">
              {t('about')}
            </a>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSelector variant="compact" />
            </div>

            <div className="hidden sm:block">
              <StateSelector variant="compact" />
            </div>

            {/* Direct Portal Access Buttons */}
            <Link
              to="/citizen"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{t('citizen_portal')}</span>
              <span className="sm:hidden">Citizen</span>
            </Link>

            <Link
              to="/authority"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <Shield className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">{t('authority_portal')}</span>
              <span className="sm:hidden">Authority</span>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg">
          <div className="pt-2 flex items-center justify-between gap-2">
            <LanguageSelector variant="hero" />
            <StateSelector variant="hero" />
          </div>
          <div className="flex flex-col space-y-2 pt-2 text-base font-semibold text-slate-700">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-900"
            >
              {t('home')}
            </Link>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              {t('how_it_works')}
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              {t('features')}
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              {t('about')}
            </a>
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            <Link
              to="/citizen"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg font-semibold bg-white text-slate-800 border border-slate-300 shadow-sm"
            >
              {t('citizen_portal')}
            </Link>
            <Link
              to="/authority"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg font-semibold bg-blue-600 text-white shadow-sm"
            >
              {t('authority_portal')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
