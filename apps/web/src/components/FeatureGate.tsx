'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  requiredTier?: 'pro' | 'team' | 'enterprise';
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  requiredTier = 'pro',
}: FeatureGateProps) {
  const router = useRouter();
  const { canAccess, tier, loading } = useSubscription();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  const hasAccess = canAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <div className="relative">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <CardTitle>Upgrade to Unlock</CardTitle>
        <CardDescription>
          This feature is available on the {requiredTier} plan and above
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade your subscription to access:
        </p>
        <ul className="text-sm text-left inline-block space-y-2">
          {requiredTier === 'pro' && (
            <>
              <li>✓ Unlimited projects</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
              <li>✓ API access</li>
            </>
          )}
          {requiredTier === 'team' && (
            <>
              <li>✓ Everything in Pro</li>
              <li>✓ Unlimited team members</li>
              <li>✓ White-label options</li>
              <li>✓ Dedicated support</li>
            </>
          )}
        </ul>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={() => router.push('/pricing')}>
          View Plans
        </Button>
      </CardFooter>
    </Card>
  );
}

// Simple wrapper for inline feature gating
export function FeatureWrapper({
  feature,
  children,
  requiredTier = 'pro',
}: {
  feature: string;
  children: ReactNode;
  requiredTier?: 'pro' | 'team' | 'enterprise';
}) {
  const { canAccess } = useSubscription();
  
  if (!canAccess(feature)) {
    return null;
  }
  
  return <>{children}</>;
}