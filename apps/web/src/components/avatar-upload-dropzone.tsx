'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AvatarUploadDropzoneProps {
  currentImageUrl?: string | null;
  userName?: string | null;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function AvatarUploadDropzone({
  currentImageUrl,
  userName,
  onUpload,
  isUploading = false,
}: AvatarUploadDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('File size must be less than 5MB');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Only JPEG, PNG, GIF, and WebP images are allowed');
        } else {
          setError('Invalid file');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        try {
          await onUpload(file);
          // Preview will be replaced with actual uploaded image URL
        } catch (err) {
          setError('Failed to upload image. Please try again.');
          setPreview(null);
        }
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isUploading,
  });

  const handleRemovePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
  };

  const displayImage = preview || currentImageUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'relative group cursor-pointer transition-all duration-200',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {/* Avatar Display */}
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
          <AvatarImage src={displayImage || undefined} />
          <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/10 to-primary/20">
            {userName ? getUserInitials(userName) : 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Overlay on hover or drag */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/60 flex items-center justify-center transition-opacity duration-200',
            isDragActive || isDragReject
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100',
            isUploading && 'opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : isDragReject ? (
            <X className="h-8 w-8 text-red-400" />
          ) : (
            <Upload className="h-8 w-8 text-white" />
          )}
        </div>

        {/* Remove button for preview */}
        {preview && !isUploading && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemovePreview}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Instructions */}
      {!isUploading && (
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">
            Click or drag image to upload
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, GIF, or WebP • Max 5MB
          </p>
        </div>
      )}

      {/* Uploading state */}
      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}