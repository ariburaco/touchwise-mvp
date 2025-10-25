import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  translations,
  supportedLanguages,
} from '@invoice-tracker/translations';

// Get initial language from cookie (client-side) or default to 'en'
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    // Client-side: get from cookie
    const cookieLanguage = document.cookie
      .split('; ')
      .find((row) => row.startsWith('preferred_language='))
      ?.split('=')[1];

    if (cookieLanguage && supportedLanguages.includes(cookieLanguage as any)) {
      return cookieLanguage;
    }
  }

  return 'en'; // Default fallback
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: translations.en,
    },
    tr: {
      translation: translations.tr,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: supportedLanguages,
  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // SSR support
  react: {
    useSuspense: false, // Disable suspense to prevent SSR issues
  },
});

export default i18n;
