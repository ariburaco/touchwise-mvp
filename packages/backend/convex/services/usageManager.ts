import { Doc, Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { 
  evaluateRules, 
  checkCredits, 
  getPeriodBoundaries
} from './ruleEngine';

// Usage check result
export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  consumed?: number;
  remaining?: number;
  creditsAvailable?: number;
  shouldWarn?: boolean;
  warningMessage?: string;
  metadata?: Record<string, any>;
}

// Track usage event
export async function trackUsage(
  ctx: MutationCtx,
  params: {
    userId: Id<'users'>;
    eventType: string;
    metricType: string;
    amount: number;
    feature?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
    requestId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<Id<'usageEvents'>> {
  const { userId, eventType, metricType, amount, ...rest } = params;
  
  // Check usage before tracking
  const checkResult = await checkUsageInternal(ctx, userId, metricType, amount, rest.feature);
  
  // Create usage event
  const eventId = await ctx.db.insert('usageEvents', {
    userId,
    eventType,
    metricType,
    amount,
    allowed: checkResult.allowed,
    reason: checkResult.reason,
    billable: checkResult.allowed && amount > 0,
    syncedToPolar: false,
    timestamp: Date.now(),
    ...rest
  });

  // Update usage tracking if allowed
  if (checkResult.allowed) {
    await updateUsageTracking(ctx, userId, metricType, amount, rest.feature);
    
    // Consume credits if applicable
    if (checkResult.creditsAvailable && checkResult.creditsAvailable > 0) {
      await consumeCredits(ctx, userId, metricType, amount);
    }
  }

  return eventId;
}

// Check if usage is allowed
export async function checkUsage(
  ctx: QueryCtx | MutationCtx,
  params: {
    userId: Id<'users'>;
    metricType: string;
    amount: number;
    feature?: string;
  }
): Promise<UsageCheckResult> {
  return checkUsageInternal(ctx, params.userId, params.metricType, params.amount, params.feature);
}

// Internal usage check
async function checkUsageInternal(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  metricType: string,
  amount: number,
  feature?: string
): Promise<UsageCheckResult> {
  // First check rules
  const ruleResult = await evaluateRules(ctx, userId, metricType, amount, feature);
  
  // If rules allow, check credits
  if (ruleResult.allowed) {
    const creditCheck = await checkCredits(ctx, userId, metricType, amount);
    
    return {
      allowed: true,
      limit: ruleResult.limit,
      consumed: ruleResult.consumed,
      remaining: ruleResult.remaining,
      creditsAvailable: creditCheck.availableCredits,
      shouldWarn: ruleResult.shouldWarn,
      warningMessage: ruleResult.shouldWarn 
        ? `You've used ${ruleResult.warningLevel?.toFixed(0)}% of your ${metricType} limit`
        : undefined
    };
  }
  
  // Check if credits can cover the usage
  const creditCheck = await checkCredits(ctx, userId, metricType, amount);
  if (creditCheck.hasCredits) {
    return {
      allowed: true,
      reason: 'Using credits',
      creditsAvailable: creditCheck.availableCredits,
      metadata: { usingCredits: true }
    };
  }
  
  // Not allowed
  return {
    allowed: false,
    reason: ruleResult.reason || 'Usage limit exceeded',
    limit: ruleResult.limit,
    consumed: ruleResult.consumed,
    remaining: 0
  };
}

// Update usage tracking
async function updateUsageTracking(
  ctx: MutationCtx,
  userId: Id<'users'>,
  metricType: string,
  amount: number,
  feature?: string
): Promise<void> {
  // Get user to determine tier
  const user = await ctx.db.get(userId);
  if (!user) return;
  
  const userTier = user.subscriptionTier || 'free';
  
  // Get applicable rules for user's tier and metric type
  const rules = await ctx.db
    .query('usageRules')
    .withIndex('by_metric_tier', (q) =>
      q.eq('metricType', metricType as 'api_calls' | 'storage' | 'ai_tokens' | 'bandwidth' | 'database_operations' | 'email_sends' | 'custom')
        .eq('tierLevel', userTier as 'free' | 'pro' | 'team' | 'enterprise')
        .eq('isActive', true)
    )
    .collect();
  
  if (rules.length === 0) return;
  
  // Use the highest priority rule (lowest priority number)
  const rule = rules.sort((a, b) => (a.priority || 999) - (b.priority || 999))[0];
  const period = rule.limitPeriod;
  // Handle lifetime period specially
  const periodForBoundaries = period === 'lifetime' ? 'year' : period;
  const { start, end } = getPeriodBoundaries(periodForBoundaries as 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year');
  
  // Get or create tracking record
  let tracking = await ctx.db
    .query('usageTracking')
    .withIndex('by_user_metric', (q) =>
      q.eq('userId', userId)
        .eq('metricType', metricType)
        .eq('currentPeriod', (period === 'lifetime' ? 'year' : period) as 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year')
    )
    .first();
  
  const now = Date.now();
  
  // Check if tracking period has expired
  if (tracking && tracking.periodEnd < now) {
    // Archive old tracking (optional: move to history table)
    await ctx.db.delete(tracking._id);
    tracking = null;
  }
  
  if (!tracking) {
    // Create new tracking record
    await ctx.db.insert('usageTracking', {
      userId,
      metricType,
      feature,
      currentPeriod: (period === 'lifetime' ? 'year' : period) as 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year',
      periodStart: start,
      periodEnd: end,
      consumed: amount,
      remaining: rule.limitValue - amount,
      limit: rule.limitValue,
      status: 'normal',
      appliedRuleId: rule.ruleId,
      createdAt: now,
      updatedAt: now
    });
  } else {
    // Update existing tracking
    const newConsumed = tracking.consumed + amount;
    const newRemaining = Math.max(0, tracking.limit - newConsumed);
    
    // Determine new status
    let status: Doc<'usageTracking'>['status'] = 'normal';
    if (newConsumed >= tracking.limit) {
      status = 'exceeded';
    } else if (rule.warningThreshold && (newConsumed / tracking.limit) * 100 >= rule.warningThreshold) {
      status = 'warning';
    }
    
    await ctx.db.patch(tracking._id, {
      consumed: newConsumed,
      remaining: newRemaining,
      status,
      updatedAt: now,
      lastWarningAt: status === 'warning' ? now : tracking.lastWarningAt,
      warningCount: status === 'warning' 
        ? (tracking.warningCount || 0) + 1 
        : tracking.warningCount
    });
  }
}

// Consume credits
async function consumeCredits(
  ctx: MutationCtx,
  userId: Id<'users'>,
  creditType: string,
  amount: number
): Promise<void> {
  // Get active credits, sorted by expiry (use soonest expiring first)
  const credits = await ctx.db
    .query('usageCredits')
    .withIndex('by_user', (q) =>
      q.eq('userId', userId)
        .eq('creditType', creditType)
        .eq('isActive', true)
    )
    .collect();
  
  // Sort by expiry date (null/undefined means no expiry, use last)
  credits.sort((a, b) => {
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return a.expiresAt - b.expiresAt;
  });
  
  let remainingAmount = amount;
  const now = Date.now();
  
  for (const credit of credits) {
    if (remainingAmount <= 0) break;
    
    // Skip expired credits
    if (credit.expiresAt && credit.expiresAt < now) {
      await ctx.db.patch(credit._id, { isActive: false });
      continue;
    }
    
    const available = credit.availableCredits - credit.usedCredits;
    if (available <= 0) continue;
    
    const toConsume = Math.min(available, remainingAmount);
    
    await ctx.db.patch(credit._id, {
      usedCredits: credit.usedCredits + toConsume,
      lastUsedAt: now,
      updatedAt: now
    });
    
    remainingAmount -= toConsume;
  }
  
  if (remainingAmount > 0) {
    console.warn(`Not enough credits to consume ${amount} ${creditType}. Short by ${remainingAmount}`);
  }
}

// Get usage summary for a user
export async function getUsageSummary(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<{
  metrics: Array<{
    metricType: string;
    period: string;
    consumed: number;
    limit: number;
    remaining: number;
    status: string;
    percentUsed: number;
    appliedRuleId?: string;
  }>;
  credits: Array<{
    creditType: string;
    available: number;
    used: number;
    total: number;
    expiresAt?: number;
  }>;
}> {
  // Get all active tracking records
  const tracking = await ctx.db
    .query('usageTracking')
    .withIndex('by_user_status', (q) => q.eq('userId', userId))
    .collect();
  
  // Get all active credits
  const credits = await ctx.db
    .query('usageCredits')
    .withIndex('by_user_active', (q) =>
      q.eq('userId', userId)
        .eq('isActive', true)
    )
    .collect();
  
  // Group credits by type
  const creditsByType: Record<string, typeof credits> = {};
  for (const credit of credits) {
    if (!creditsByType[credit.creditType]) {
      creditsByType[credit.creditType] = [];
    }
    creditsByType[credit.creditType].push(credit);
  }
  
  return {
    metrics: tracking.map(t => ({
      metricType: t.metricType,
      period: t.currentPeriod,
      consumed: t.consumed,
      limit: t.limit,
      remaining: t.remaining,
      status: t.status,
      percentUsed: (t.consumed / t.limit) * 100,
      appliedRuleId: t.appliedRuleId
    })),
    credits: Object.entries(creditsByType).map(([type, typeCredits]) => {
      const total = typeCredits.reduce((sum, c) => sum + c.totalAllocated, 0);
      const used = typeCredits.reduce((sum, c) => sum + c.usedCredits, 0);
      const available = typeCredits.reduce(
        (sum, c) => sum + (c.availableCredits - c.usedCredits),
        0
      );
      const earliestExpiry = typeCredits
        .filter(c => c.expiresAt)
        .map(c => c.expiresAt!)
        .sort()[0];
      
      return {
        creditType: type,
        available,
        used,
        total,
        expiresAt: earliestExpiry
      };
    })
  };
}

// Reset usage for a period (called by cron/scheduler)
export async function resetUsageForPeriod(
  ctx: MutationCtx,
  period: string
): Promise<void> {
  const now = Date.now();
  
  // Find all tracking records that have expired
  const expiredTracking = await ctx.db
    .query('usageTracking')
    .withIndex('by_period', (q) => q.lt('periodEnd', now))
    .filter((q) => q.eq(q.field('currentPeriod'), period as 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'))
    .collect();
  
  for (const tracking of expiredTracking) {
    // Archive or delete old tracking
    await ctx.db.delete(tracking._id);
    
    // Could also move to a history table here
  }
}

// Export as object for easier importing
export const usageManager = {
  trackUsage: async (
    ctx: MutationCtx, 
    userId: Id<'users'>,
    metricType: string,
    amount: number,
    options?: {
      feature?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    const checkResult = await checkUsageInternal(ctx, userId, metricType, amount, options?.feature);
    
    // Create usage event
    const eventId = await ctx.db.insert('usageEvents', {
      userId,
      eventType: 'usage',
      metricType,
      amount,
      feature: options?.feature,
      metadata: options?.metadata,
      allowed: checkResult.allowed,
      reason: checkResult.reason,
      billable: checkResult.allowed,
      syncedToPolar: false,
      timestamp: Date.now(),
    });

    // Update tracking
    if (checkResult.allowed) {
      await updateUsageTracking(ctx, userId, metricType, amount, checkResult.metadata?.period || 'day');
    }

    return {
      eventId,
      allowed: checkResult.allowed,
      warning: checkResult.shouldWarn,
      remaining: checkResult.remaining,
      creditsUsed: checkResult.metadata?.creditsUsed,
    };
  },
  checkUsage: checkUsageInternal,
  updateUsageTracking,
  resetUsageForPeriod,
};