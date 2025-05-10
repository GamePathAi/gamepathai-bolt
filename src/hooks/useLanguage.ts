import { useTranslation } from 'react-i18next';
import { LANGUAGES, cacheLanguageResources, loadCachedLanguageResources } from '../i18n';
import { useCallback } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(async (lng: string) => {
    try {
      // Try to load cached resources first
      const hasCached = await loadCachedLanguageResources(lng);
      
      // Change language
      await i18n.changeLanguage(lng);
      
      // If no cached resources, try to cache them now
      if (!hasCached) {
        await cacheLanguageResources(lng);
      }
      
      // Update document direction
      document.dir = LANGUAGES[lng as keyof typeof LANGUAGES]?.dir || 'ltr';
      
      // Store language preference
      localStorage.setItem('i18nextLng', lng);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    languages: LANGUAGES,
    direction: document.dir,
  };
};