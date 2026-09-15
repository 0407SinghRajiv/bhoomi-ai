import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { SUPPORTED_LANGUAGES } from '../../utils/translations';
import type { SupportedLanguage } from '../../utils/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'hero';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'compact' }) => {
  const { currentLanguage, setLanguage } = useAppState();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition shadow-sm ${
          variant === 'hero'
            ? 'px-3.5 py-2 bg-white text-slate-800 border-slate-300 hover:bg-slate-50 text-sm'
            : 'px-2.5 py-1.5 bg-white text-slate-700 border-slate-300 hover:bg-slate-50 text-xs'
        }`}
        title="Select Language"
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="font-medium">{activeLang.flag} {activeLang.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 divide-y divide-slate-100 text-xs">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Select Language / भाषा
          </div>
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50 transition ${
                    isSelected ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-slate-400 text-[10px]">({lang.name})</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
