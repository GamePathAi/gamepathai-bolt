import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { get, set } from 'idb-keyval';

// Language configurations
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  es: { name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  'pt-BR': { name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', dir: 'ltr' },
  fr: { name: 'French', nativeName: 'Français', dir: 'ltr' },
  de: { name: 'German', nativeName: 'Deutsch', dir: 'ltr' }
};

// Initialize i18next
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
      allowMultiLoading: false,
      crossDomain: false,
    },
    fallbackLng: 'en',
    supportedLngs: Object.keys(LANGUAGES),
    ns: ['common', 'auth', 'settings', 'dashboard'],
    defaultNS: 'common',
    fallbackNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false
    }
  });

// Cache management
export const cacheLanguageResources = async (lng: string) => {
  try {
    const namespaces = ['common', 'auth', 'settings', 'dashboard'];
    const resources: Record<string, any> = {};

    for (const ns of namespaces) {
      try {
        const response = await fetch(`/locales/${lng}/${ns}.json`);
        
        if (!response.ok) {
          console.warn(`Failed to fetch ${ns} namespace for ${lng}`);
          continue;
        }

        const data = await response.json();
        resources[ns] = data;
        
        // Cache individual namespace
        await set(`i18n_${lng}_${ns}`, data);
      } catch (error) {
        console.warn(`Error caching ${ns} namespace for ${lng}:`, error);
        // Try to get from existing cache
        const cached = await get(`i18n_${lng}_${ns}`);
        if (cached) {
          resources[ns] = cached;
        }
      }
    }

    // Cache complete language resources
    if (Object.keys(resources).length > 0) {
      await set(`i18n_${lng}`, resources);
    }

    return resources;
  } catch (error) {
    console.error(`Failed to cache language resources for ${lng}:`, error);
    return null;
  }
};

export const loadCachedLanguageResources = async (lng: string) => {
  try {
    const cached = await get(`i18n_${lng}`);
    if (cached) {
      Object.entries(cached).forEach(([ns, resources]) => {
        i18n.addResourceBundle(lng, ns, resources, true, true);
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to load cached language resources for ${lng}:`, error);
    return false;
  }
};

// Language direction utility
export const getLanguageDirection = (lng: string) => {
  return LANGUAGES[lng as keyof typeof LANGUAGES]?.dir || 'ltr';
};

export default i18n;