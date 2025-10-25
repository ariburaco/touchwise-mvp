'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { useTypedTranslation } from '@/lib/useTypedTranslation';

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export function DeleteDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  isLoading = false 
}: DeleteDialogProps) {
  const { t } = useTypedTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        </div>
        
        <p className="text-muted-foreground mb-6">
          {description}
        </p>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}