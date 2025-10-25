'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSkeleton } from './ui/loading-skeleton';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/login');
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
