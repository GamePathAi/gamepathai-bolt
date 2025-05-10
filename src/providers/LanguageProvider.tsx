import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, getLanguageDirection } from '../i18n';
import { useLanguage } from '../hooks/useLanguage';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lng: string) => Promise<void>;
  languages: typeof LANGUAGES;
  direction: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentLanguage, changeLanguage, languages, direction } = useLanguage();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set initial direction
    document.dir = getLanguageDirection(i18n.language);
    
    // Update direction when language changes
    const handleLanguageChange = (lng: string) => {
      document.dir = getLanguageDirection(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, languages, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};