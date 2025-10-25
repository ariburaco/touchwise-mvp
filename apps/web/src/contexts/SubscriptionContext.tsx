'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';

type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise' | 'lifetime';

interface SubscriptionLimits {
  projects?: number;
  teamMembers?: number;
  storage?: number; // in GB
  apiCalls?: number;
  customIntegrations?: boolean;
  prioritySupport?: boolean;
  advancedAnalytics?: boolean;
  whiteLabel?: boolean;
}

interface SubscriptionContextValue {
  subscription: any | null;
  tier: SubscriptionTier;
  isActive: boolean;
  isTrialing: boolean;
  isPro: boolean;
  isTeam: boolean;
  limits: SubscriptionLimits;
  canAccess: (feature: string) => boolean;
  daysUntilRenewal: number | null;
  loading: boolean;
}

const defaultLimits: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    projects: 5,
    teamMembers: 1,
    storage: 1,
    apiCalls: 1000,
    customIntegrations: false,
    prioritySupport: false,
    advancedAnalytics: false,
    whiteLabel: false,
  },
  pro: {
    projects: undefined, // unlimited
    teamMembers: 10,
    storage: 100,
    apiCalls: 100000,
    customIntegrations: true,
    prioritySupport: true,
    advancedAnalytics: true,
    whiteLabel: false,
  },
  team: {
    projects: undefined, // unlimited
    teamMembers: undefined, // unlimited
    storage: undefined, // unlimited
    apiCalls: undefined, // unlimited
    customIntegrations: true,
    prioritySupport: true,
    advancedAnalytics: true,
    whiteLabel: true,
  },
  enterprise: {
    projects: undefined,
    teamMembers: undefined,
    storage: undefined,
    apiCalls: undefined,
    customIntegrations: true,
    prioritySupport: true,
    advancedAnalytics: true,
    whiteLabel: true,
  },
  lifetime: {
    projects: undefined, // unlimited
    teamMembers: undefined, // unlimited
    storage: undefined, // unlimited
    apiCalls: undefined, // unlimited
    customIntegrations: true,
    prioritySupport: true,
    advancedAnalytics: true,
    whiteLabel: true,
  },
};

const featureTiers: Record<string, SubscriptionTier[]> = {
  unlimited_projects: ['pro', 'team', 'enterprise', 'lifetime'],
  team_collaboration: ['pro', 'team', 'enterprise', 'lifetime'],
  advanced_analytics: ['pro', 'team', 'enterprise', 'lifetime'],
  custom_integrations: ['pro', 'team', 'enterprise', 'lifetime'],
  api_access: ['pro', 'team', 'enterprise', 'lifetime'],
  priority_support: ['pro', 'team', 'enterprise', 'lifetime'],
  white_label: ['team', 'enterprise', 'lifetime'],
  sla_guarantee: ['team', 'enterprise', 'lifetime'],
  audit_logs: ['team', 'enterprise', 'lifetime'],
  dedicated_account_manager: ['team', 'enterprise', 'lifetime'],
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  
  // Get subscription data from the session
  const subscription = session?.subscription || null;
  const dbUser = session?.dbUser || null;
  const loading = isLoading;

  const value = useMemo(() => {
    // Get tier directly from dbUser.subscriptionTier
    const tier: SubscriptionTier = dbUser?.subscriptionTier || 'free';

    const isActive = subscription?.status === 'active' || subscription?.isLifetime === true;
    const isTrialing = subscription?.status === 'trialing';
    const isPro = tier === 'pro' || tier === 'lifetime';
    const isTeam = tier === 'team' || tier === 'lifetime';

    const limits = defaultLimits[tier];

    const canAccess = (feature: string): boolean => {
      const allowedTiers = featureTiers[feature];
      if (!allowedTiers) return true; // Unknown feature, allow by default
      return allowedTiers.includes(tier);
    };

    const daysUntilRenewal = subscription?.currentPeriodEnd
      ? Math.max(
          0,
          Math.ceil(
            (subscription.currentPeriodEnd - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;

    return {
      subscription,
      tier,
      isActive: isActive || isTrialing,
      isTrialing,
      isPro,
      isTeam,
      limits,
      canAccess,
      daysUntilRenewal,
      loading,
    };
  }, [subscription, dbUser, loading]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
}
