import { useTranslation } from 'react-i18next';
import type { TranslationKey } from '@invoice-tracker/translations';

/**
 * Interpolation options for translations that support parameters
 */
export interface InterpolationOptions {
  [key: string]: string | number;
}

/**
 * Typed translation function that provides compile-time type safety
 * and autocomplete for translation keys
 */
export interface TypedTFunction {
  (key: TranslationKey, options?: InterpolationOptions): string;
}

/**
 * Hook that provides typed translation functionality
 * This ensures compile-time type safety and autocomplete for translation keys
 */
export function useTypedTranslation() {
  const { t: originalT, i18n } = useTranslation();

  // Typed wrapper around the original translation function
  const t: TypedTFunction = (key: TranslationKey, options?: InterpolationOptions) => {
    return originalT(key, options);
  };

  return {
    t,
    i18n,
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
  };
}

/**
 * Shorthand hook for typed translations
 * Usage: const t = useT();
 */
export function useT(): TypedTFunction {
  const { t } = useTypedTranslation();
  return t;
}

/**
 * Export the translation function type for use in non-hook contexts
 */
export type TranslationFunction = TypedTFunction;