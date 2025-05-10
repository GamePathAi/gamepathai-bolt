import { useTranslation } from 'react-i18next';
import { LANGUAGES, cacheLanguageResources, loadCachedLanguageResources } from '../i18n';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(async (lng: string) => {
    try {
      // First try to load cached resources
      await loadCachedLanguageResources(lng);
      
      // Change language - this will trigger i18next's built-in loading if needed
      await i18n.changeLanguage(lng);
      
      // Cache resources in the background
      cacheLanguageResources(lng).catch(error => {
        // Just log the error - the language change was still successful
        console.warn('Failed to cache language resources:', error);
      });
      
      // Update document direction
      document.dir = LANGUAGES[lng as keyof typeof LANGUAGES]?.dir || 'ltr';
      
      // Store language preference
      localStorage.setItem('i18nextLng', lng);
    } catch (error) {
      console.error('Failed to change language:', error);
      // Don't throw - the UI can still function with the current language
    }
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    languages: LANGUAGES,
    direction: document.dir,
  };
};