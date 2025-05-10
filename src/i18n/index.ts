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
      requestOptions: {
        // Ensure proper headers are set
        headers: {
          'Content-Type': 'application/json'
        }
      }
    },
    fallbackLng: 'en',
    supportedLngs: Object.keys(LANGUAGES),
    ns: ['common', 'auth', 'settings', 'dashboard'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`Warning: Expected JSON but got ${contentType} for ${ns} namespace`);
          // Try to parse as JSON anyway - some servers might send wrong content type
          const text = await response.text();
          try {
            resources[ns] = JSON.parse(text);
            continue;
          } catch (e) {
            throw new Error(`Invalid content type for ${ns} namespace: ${contentType}`);
          }
        }

        resources[ns] = await response.json();
      } catch (error) {
        console.error(`Failed to fetch ${ns} namespace:`, error);
        // Don't throw here - continue with other namespaces
        // Use any cached version if available
        const cached = await get(`i18n_${lng}_${ns}`);
        if (cached) {
          resources[ns] = cached;
        }
      }
    }

    // Only cache if we have at least some resources
    if (Object.keys(resources).length > 0) {
      await set(`i18n_${lng}`, resources);
    }
  } catch (error) {
    console.error(`Failed to cache language resources for ${lng}:`, error);
    // Don't throw - we can still use i18next's built-in loading
  }
};

export const loadCachedLanguageResources = async (lng: string) => {
  try {
    const cached = await get(`i18n_${lng}`);
    if (cached) {
      Object.entries(cached).forEach(([ns, resources]) => {
        i18n.addResourceBundle(lng, ns, resources, true, true);
      });
    }
  } catch (error) {
    console.error(`Failed to load cached language resources for ${lng}:`, error);
    // Don't throw - i18next will load resources from the backend
  }
};

// Language direction utility
export const getLanguageDirection = (lng: string) => {
  return LANGUAGES[lng as keyof typeof LANGUAGES]?.dir || 'ltr';
};

export default i18n;