'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { Button } from './button';
import { useTypedTranslation } from '@/lib/useTypedTranslation';
import { cn } from '@/lib/utils';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
  onDownload?: () => void;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
  onDownload,
}: ImageModalProps) {
  const { t } = useTypedTranslation();
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [touches, setTouches] = useState<React.TouchList | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide controls on mobile
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isMobile) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isMobile]);

  // Helper function to get distance between two touches
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Helper function to get center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers for mobile pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    resetControlsTimeout();
    const touches = e.touches;
    setTouches(touches);

    if (touches.length === 1) {
      // Single touch - start dragging if zoomed
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: touches[0].clientX - position.x,
          y: touches[0].clientY - position.y,
        });
      }
    } else if (touches.length === 2) {
      // Two touches - start pinch zoom
      setIsDragging(false);
      const distance = getTouchDistance(touches);
      setInitialPinchDistance(distance);
      setInitialScale(scale);
    }
  }, [scale, position, resetControlsTimeout, getTouchDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && isDragging && scale > 1) {
      // Single touch - drag image
      setPosition({
        x: touches[0].clientX - dragStart.x,
        y: touches[0].clientY - dragStart.y,
      });
    } else if (touches.length === 2 && initialPinchDistance > 0) {
      // Two touches - pinch zoom
      const currentDistance = getTouchDistance(touches);
      const distanceRatio = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(initialScale * distanceRatio, 0.5), 5);

      // Get pinch center for zooming towards touch center
      const center = getTouchCenter(touches);
      const containerRect = containerRef.current?.getBoundingClientRect();
      
      if (containerRect) {
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const touchX = center.x - containerRect.left;
        const touchY = center.y - containerRect.top;

        // Calculate offset from center
        const offsetX = touchX - centerX;
        const offsetY = touchY - centerY;

        // Calculate new position to zoom towards touch center
        const scaleDelta = newScale / scale;
        const newX = position.x - offsetX * (scaleDelta - 1);
        const newY = position.y - offsetY * (scaleDelta - 1);

        setScale(newScale);
        setPosition({ x: newX, y: newY });
      } else {
        setScale(newScale);
      }
    }
  }, [isDragging, scale, position, dragStart, initialPinchDistance, initialScale, getTouchDistance, getTouchCenter]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTouches(null);
    setInitialPinchDistance(0);
    
    // Reset controls timeout
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (!containerRef.current) return;

      const delta = e.deltaY > 0 ? -1 : 1;
      const zoomFactor = 1.1;
      const newScale =
        delta > 0
          ? Math.min(scale * zoomFactor, 5)
          : Math.max(scale / zoomFactor, 0.5);

      // Calculate zoom center point (mouse position)
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate offset from center
      const offsetX = mouseX - centerX;
      const offsetY = mouseY - centerY;

      // Calculate new position to zoom towards mouse
      const scaleDelta = newScale / scale;
      const newX = position.x - offsetX * (scaleDelta - 1);
      const newY = position.y - offsetY * (scaleDelta - 1);

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    },
    [scale, position]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (scale > 1) {
        handleReset();
      } else {
        setScale(2);
      }
    },
    [scale]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case '0':
          handleReset();
          break;
      }
    },
    [onClose, handleZoomIn, handleZoomOut, handleRotate, handleReset]
  );

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      handleReset();
      resetControlsTimeout();
    }
  }, [isOpen, resetControlsTimeout]);

  // Add keyboard event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Prevent iOS bounce effect
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
      document.body.style.overscrollBehavior = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
      document.body.style.overscrollBehavior = 'auto';
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onTouchMove={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className={cn(
        "absolute top-4 left-4 right-4 flex items-center justify-between z-10 transition-opacity duration-300",
        isMobile ? (showControls ? "opacity-100" : "opacity-0 pointer-events-none") : "opacity-100"
      )}>
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="secondary"
            size={isMobile ? "sm" : "sm"}
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className={cn(isMobile && "h-8 w-8 p-0")}
          >
            <ZoomOut className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          <span className="text-white text-xs md:text-sm min-w-[50px] md:min-w-[60px] text-center bg-black/50 px-2 py-1 rounded">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="secondary"
            size={isMobile ? "sm" : "sm"}
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className={cn(isMobile && "h-8 w-8 p-0")}
          >
            <ZoomIn className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          <Button 
            variant="secondary" 
            size={isMobile ? "sm" : "sm"} 
            onClick={handleRotate}
            className={cn(isMobile && "h-8 w-8 p-0")}
          >
            <RotateCw className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          {!isMobile && (
            <Button variant="secondary" size="sm" onClick={handleReset}>
              {t('common.reset')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {onDownload && !isMobile && (
            <Button variant="secondary" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('common.download')}
            </Button>
          )}
          <Button 
            variant="secondary" 
            size={isMobile ? "sm" : "sm"} 
            onClick={onClose}
            className={cn(isMobile && "h-8 w-8 p-0")}
          >
            <X className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={resetControlsTimeout}
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          touchAction: 'none',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          className="max-w-none transition-transform duration-150 ease-out select-none touch-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none',
            touchAction: 'none',
            maxWidth: 'none',
            maxHeight: '100vh',
            width: 'auto',
            height: 'auto',
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Instructions */}
      <div className={cn(
        "absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center bg-black/50 px-4 py-2 rounded-lg transition-opacity duration-300",
        isMobile ? (showControls ? "opacity-100" : "opacity-0") : "opacity-100"
      )}>
        {isMobile ? (
          <div className="text-xs">
            <p className="mb-1">Pinch to zoom • Double tap to reset</p>
            <p className="opacity-75">Tap to show/hide controls</p>
          </div>
        ) : (
          <div className="text-sm">
            <p className="mb-1">{t('common.keyboardShortcuts')}</p>
            <p className="text-xs opacity-75">
              ESC: {t('common.close')} • +/-: {t('common.zoom')} • R:{' '}
              {t('common.rotate')} • 0: {t('common.reset')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
