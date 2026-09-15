import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STATE_METADATA_MAP } from '../types';
import type { IndianState, StateRecordMetadata } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import type { SupportedLanguage } from '../utils/translations';

interface AppStateContextType {
  selectedState: IndianState;
  setSelectedState: (state: IndianState) => void;
  stateMetadata: StateRecordMetadata;
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  isDemoMode: boolean;
  clearState: () => void;
}

const STORAGE_KEY_STATE = 'bhoomi_selected_state';
const STORAGE_KEY_LANG = 'bhoomi_selected_language';

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedState, setSelectedStateInternal] = useState<IndianState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved && saved in STATE_METADATA_MAP) {
        return saved as IndianState;
      }
    } catch {
      // ignore storage errors
    }
    return 'Maharashtra';
  });

  const [currentLanguage, setCurrentLanguageInternal] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved && saved in TRANSLATIONS) {
        return saved as SupportedLanguage;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setSelectedState = (state: IndianState) => {
    setSelectedStateInternal(state);
    try {
      localStorage.setItem(STORAGE_KEY_STATE, state);
    } catch {
      // ignore
    }
  };

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguageInternal(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {
      // ignore
    }
  };

  const t = useCallback(
    (key: string): string => {
      const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
      return langDict[key] || TRANSLATIONS.en[key] || key;
    },
    [currentLanguage]
  );

  const clearState = () => {
    setSelectedState('Maharashtra');
    setLanguage('en');
  };

  useEffect(() => {
    document.title = `BhoomiAI [${selectedState}] — Land Record Intelligence`;
  }, [selectedState]);

  const stateMetadata = STATE_METADATA_MAP[selectedState] || STATE_METADATA_MAP.Maharashtra;

  return (
    <AppStateContext.Provider
      value={{
        selectedState,
        setSelectedState,
        stateMetadata,
        currentLanguage,
        setLanguage,
        t,
        isDemoMode: true,
        clearState,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
