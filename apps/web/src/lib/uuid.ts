/**
 * UUID generation utility with fallback for browsers that don't support crypto.randomUUID
 */

/**
 * Generate a UUID v4 string
 * Falls back to a custom implementation if crypto.randomUUID is not available (e.g., on some mobile browsers)
 */
export function generateUUID(): string {
  // Try to use native crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for browsers without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short unique ID (8 characters)
 * Useful for component keys or temporary IDs
 */
export function generateShortId(): string {
  return Math.random().toString(36).substr(2, 8);
}