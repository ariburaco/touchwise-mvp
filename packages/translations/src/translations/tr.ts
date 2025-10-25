// Re-export everything from the modular structure
export { trTranslations, type TranslationKeys } from './tr/index';

// Helper type to check structure compatibility while allowing different string values
type StructureCheck<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? StructureCheck<T[K]>
      : T[K];
};

// Type check to ensure Turkish translations match English structure
import type { TranslationKeys as EnglishKeys } from './en';
import { trTranslations } from './tr/index';

const _typeCheck: StructureCheck<EnglishKeys> = trTranslations;

// Prevent unused variable warning
void _typeCheck;