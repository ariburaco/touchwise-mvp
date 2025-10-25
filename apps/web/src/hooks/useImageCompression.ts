'use client';

import { useCallback } from 'react';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export function useImageCompression() {
  const compressImage = useCallback(async (
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> => {
    const {
      maxWidth = 1200,
      maxHeight = 1600,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.fillStyle = '#FFFFFF'; // White background for JPEG
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const originalSize = file.size;
              const compressedSize = blob.size;
              const compressionRatio = originalSize / compressedSize;

              resolve({
                blob,
                originalSize,
                compressedSize,
                compressionRatio,
              });
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Load the image
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(img.src);
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  const createImagePreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  const revokeImagePreview = useCallback((url: string) => {
    URL.revokeObjectURL(url);
  }, []);

  // Check if image needs compression
  const shouldCompress = useCallback((file: File, maxSizeMB: number = 2): boolean => {
    const sizeMB = file.size / (1024 * 1024);
    return sizeMB > maxSizeMB;
  }, []);

  // Get optimal compression settings based on file size and type
  const getOptimalSettings = useCallback((file: File): CompressionOptions => {
    const sizeMB = file.size / (1024 * 1024);
    
    // Adjust quality based on file size
    let quality = 0.8;
    if (sizeMB > 5) {
      quality = 0.6; // More aggressive compression for large files
    } else if (sizeMB > 2) {
      quality = 0.7;
    }

    // Adjust dimensions based on file size
    let maxWidth = 1200;
    let maxHeight = 1600;
    if (sizeMB > 10) {
      maxWidth = 800;
      maxHeight = 1200;
    }

    return {
      maxWidth,
      maxHeight,
      quality,
      format: 'jpeg', // Always use JPEG for receipts
    };
  }, []);

  return {
    compressImage,
    getImageDimensions,
    createImagePreview,
    revokeImagePreview,
    shouldCompress,
    getOptimalSettings,
  };
}