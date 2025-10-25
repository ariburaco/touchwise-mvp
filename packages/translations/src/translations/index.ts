export {
  enTranslations,
  type TranslationKeys,
  type TranslationKey,
} from './en';
export { trTranslations } from './tr';

import { enTranslations } from './en';
import { trTranslations } from './tr';

// Export all translations for easy access
export const translations = {
  en: enTranslations,
  tr: trTranslations,
} as const;

// Supported languages
export const supportedLanguages = ['en', 'tr'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
