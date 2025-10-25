// Import all translation sections

import { auth } from './auth';

import { common } from './common';

// Export the complete translation object
export const enTranslations = {
  auth,
  common,
} as const;

// Export the type for other files to use
export type TranslationKeys = typeof enTranslations;

// Helper type to get nested keys with dot notation
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationKeys>;
