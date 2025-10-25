'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';
import { useTypedTranslation } from '@/lib/useTypedTranslation';

interface UsePageLeaveProtectionOptions {
  enabled: boolean;
  message?: string;
}

export function usePageLeaveProtection({ enabled, message }: UsePageLeaveProtectionOptions) {
  const router = useRouter();
  const { t } = useTypedTranslation();
  const [isNavigating, setIsNavigating] = useState(false);

  const defaultMessage = t('common.unsavedChangesWarning');
  const confirmMessage = message || defaultMessage;

  // Handle browser page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled && !isNavigating) {
        // Modern browsers ignore custom messages and show their own
        event.preventDefault();
        // eslint-disable-next-line deprecation/deprecation
        event.returnValue = confirmMessage;
      }
    };

    if (enabled) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, confirmMessage, isNavigating]);

  // Handle programmatic navigation (Next.js router)
  const confirmNavigation = useCallback(
    (_url: string) => {
      if (!enabled || isNavigating) return true;
      
      const confirmed = window.confirm(
        `${confirmMessage}\n\n${t('common.continueLeaving')}`
      );
      
      if (confirmed) {
        setIsNavigating(true);
        return true;
      }
      
      return false;
    },
    [enabled, confirmMessage, isNavigating, t]
  );

  // Override router methods to add confirmation
  const protectedRouter = {
    ...router,
    push: useCallback(
      (url: string, options?: any) => {
        if (confirmNavigation(url)) {
          return router.push(url, options);
        }
      },
      [router, confirmNavigation]
    ),
    replace: useCallback(
      (url: string, options?: any) => {
        if (confirmNavigation(url)) {
          return router.replace(url, options);
        }
      },
      [router, confirmNavigation]
    ),
    back: useCallback(() => {
      if (confirmNavigation('back')) {
        return router.back();
      }
    }, [router, confirmNavigation]),
  };

  return {
    protectedRouter,
    isNavigating,
    setNavigating: setIsNavigating,
  };
}