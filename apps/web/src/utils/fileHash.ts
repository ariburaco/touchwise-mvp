/**
 * Calculate MD5 hash of a file
 * Uses Web Crypto API for secure hash generation
 */
export async function calculateFileHash(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Calculate SHA-256 hash (more secure than MD5)
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error calculating file hash:', error);
    throw new Error('Failed to calculate file hash');
  }
}

/**
 * Calculate hash for multiple files
 */
export async function calculateMultipleFileHashes(files: File[]): Promise<Map<string, string>> {
  const hashMap = new Map<string, string>();
  
  // Calculate hashes in parallel
  const hashPromises = files.map(async (file) => {
    const hash = await calculateFileHash(file);
    return { fileName: file.name, hash };
  });
  
  const results = await Promise.all(hashPromises);
  
  results.forEach(({ fileName, hash }) => {
    hashMap.set(fileName, hash);
  });
  
  return hashMap;
}

/**
 * Generate a quick hash for immediate duplicate detection
 * Uses file size + name + last modified date for quick comparison
 */
export function generateQuickFileSignature(file: File): string {
  const signature = `${file.size}-${file.name}-${file.lastModified}`;
  return btoa(signature); // Base64 encode for consistent format
}

/**
 * Check if two files have the same quick signature
 */
export function haveSameQuickSignature(file1: File, file2: File): boolean {
  return generateQuickFileSignature(file1) === generateQuickFileSignature(file2);
}

/**
 * Get file metadata for duplicate detection
 */
export function getFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    quickSignature: generateQuickFileSignature(file),
  };
}