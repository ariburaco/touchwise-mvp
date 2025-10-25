'use client';

import React, { createContext, useContext } from 'react';
import { SupportedLanguage } from '@invoice-tracker/translations';
import { useSettings } from '@/contexts/SettingsContext';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage, isLoading } = useSettings();
  
  // Provide default language while loading
  const currentLanguage = language || 'en';
  // Language is ready when settings are loaded (not loading)
  const isReady = !isLoading;

  return (
    <LanguageContext.Provider value={{ 
      language: currentLanguage, 
      setLanguage: setLanguage as (lang: SupportedLanguage) => void, 
      isReady 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};