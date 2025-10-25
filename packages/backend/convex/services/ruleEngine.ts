import { Doc, Id } from '../_generated/dataModel';
import { QueryCtx, MutationCtx } from '../_generated/server';

type MetricType = 'api_calls' | 'storage' | 'ai_tokens' | 'bandwidth' | 'database_operations' | 'email_sends' | 'custom';
type PeriodType = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'lifetime';
type TierType = 'free' | 'pro' | 'team' | 'enterprise' | 'lifetime' | 'custom';

// Rule evaluation result
export interface RuleEvaluationResult {
  allowed: boolean;
  ruleId?: string;
  ruleName?: string;
  limit?: number;
  consumed?: number;
  remaining?: number;
  reason?: string;
  warningLevel?: number;
  shouldWarn?: boolean;
  overageAllowed?: boolean;
  overageCost?: number;
}

// Get applicable rules for a user based on tier and metric
export async function getApplicableRules(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  metricType: MetricType | string,
  feature?: string
): Promise<Doc<'usageRules'>[]> {
  // Get user to determine tier
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const tier = user.subscriptionTier || 'free';

  // Get all active rules for this tier and metric, sorted by priority
  let rules = await ctx.db
    .query('usageRules')
    .withIndex('by_metric_tier', (q) => 
      q.eq('metricType', metricType as MetricType)
        .eq('tierLevel', tier)
        .eq('isActive', true)
    )
    .collect();

  // Filter by feature if specified
  if (feature) {
    rules = rules.filter(rule => {
      // Check if feature is in included features
      if (rule.features && rule.features.length > 0) {
        if (!rule.features.includes(feature)) {
          return false;
        }
      }
      
      // Check if feature is in excluded features
      if (rule.excludedFeatures && rule.excludedFeatures.includes(feature)) {
        return false;
      }
      
      return true;
    });
  }

  // Filter by effective dates
  const now = Date.now();
  rules = rules.filter(rule => {
    if (rule.effectiveFrom && rule.effectiveFrom > now) {
      return false;
    }
    if (rule.effectiveUntil && rule.effectiveUntil < now) {
      return false;
    }
    return true;
  });

  // Sort by priority (higher priority first)
  rules.sort((a, b) => b.priority - a.priority);

  return rules;
}

// Evaluate rules against current usage
export async function evaluateRules(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  metricType: string,
  requestedAmount: number,
  feature?: string
): Promise<RuleEvaluationResult> {
  // Get applicable rules
  const rules = await getApplicableRules(ctx, userId, metricType, feature);
  
  if (rules.length === 0) {
    // No rules found, allow by default (or could deny by default based on config)
    return {
      allowed: true,
      reason: 'No usage rules configured'
    };
  }

  // Use the highest priority rule
  const rule = rules[0];

  // Get current usage tracking for this metric
  const tracking = await ctx.db
    .query('usageTracking')
    .withIndex('by_user_metric', (q) =>
      q.eq('userId', userId)
        .eq('metricType', metricType)
        .eq('currentPeriod', rule.limitPeriod as 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year')
    )
    .first();

  // Calculate current usage
  const currentUsage = tracking?.consumed || 0;
  const projectedUsage = currentUsage + requestedAmount;
  const limit = rule.limitValue;
  const remaining = Math.max(0, limit - currentUsage);

  // Check if within limit
  if (projectedUsage <= limit) {
    // Check if we should warn
    const usagePercentage = (projectedUsage / limit) * 100;
    const shouldWarn = rule.warningThreshold && usagePercentage >= rule.warningThreshold ? true : false;

    return {
      allowed: true,
      ruleId: rule.ruleId,
      ruleName: rule.name,
      limit,
      consumed: projectedUsage,
      remaining: limit - projectedUsage,
      shouldWarn,
      warningLevel: shouldWarn ? usagePercentage : undefined
    };
  }

  // Over limit - check if hard or soft limit
  if (rule.limitType === 'soft') {
    // Check if overage is allowed
    if (rule.overageAllowed) {
      // Calculate overage cost
      const overageAmount = projectedUsage - limit;
      const overageCost = rule.overagePricePerUnit 
        ? overageAmount * rule.overagePricePerUnit
        : undefined;

      return {
        allowed: true,
        ruleId: rule.ruleId,
        ruleName: rule.name,
        limit,
        consumed: projectedUsage,
        remaining: 0,
        overageAllowed: true,
        overageCost,
        shouldWarn: true,
        warningLevel: 100,
        reason: 'Soft limit exceeded, overage charges may apply'
      };
    }

    // Check if in grace period
    if (rule.gracePeriod) {
      const graceAmount = limit + rule.gracePeriod;
      if (projectedUsage <= graceAmount) {
        return {
          allowed: true,
          ruleId: rule.ruleId,
          ruleName: rule.name,
          limit,
          consumed: projectedUsage,
          remaining: 0,
          shouldWarn: true,
          warningLevel: 100,
          reason: 'In grace period'
        };
      }
    }
  }

  // Hard limit or soft limit exceeded without overage
  return {
    allowed: false,
    ruleId: rule.ruleId,
    ruleName: rule.name,
    limit,
    consumed: currentUsage,
    remaining: 0,
    reason: `${rule.name} limit exceeded (${currentUsage}/${limit})`
  };
}

// Check if user has credits for a metric
export async function checkCredits(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  creditType: string,
  requestedAmount: number
): Promise<{ hasCredits: boolean; availableCredits: number }> {
  // Get active credits for user
  const credits = await ctx.db
    .query('usageCredits')
    .withIndex('by_user', (q) =>
      q.eq('userId', userId)
        .eq('creditType', creditType)
        .eq('isActive', true)
    )
    .collect();

  // Filter out expired credits
  const now = Date.now();
  const validCredits = credits.filter(credit => {
    if (credit.expiresAt && credit.expiresAt < now) {
      return false;
    }
    return true;
  });

  // Calculate total available credits
  const totalAvailable = validCredits.reduce(
    (sum, credit) => sum + (credit.availableCredits - credit.usedCredits),
    0
  );

  return {
    hasCredits: totalAvailable >= requestedAmount,
    availableCredits: totalAvailable
  };
}

// Get default rules for a tier
export async function getDefaultRulesForTier(
  ctx: QueryCtx | MutationCtx,
  tier: TierType | string
): Promise<Doc<'usageRules'>[]> {
  return await ctx.db
    .query('usageRules')
    .withIndex('by_tier', (q) =>
      q.eq('tierLevel', tier as TierType)
        .eq('isActive', true)
    )
    .filter((q) => q.eq(q.field('isDefault'), true))
    .collect();
}

// Calculate period boundaries
export function getPeriodBoundaries(period: PeriodType | string): { start: number; end: number } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'minute':
      start = new Date(now);
      start.setSeconds(0, 0);
      end = new Date(start);
      end.setMinutes(end.getMinutes() + 1);
      break;
    
    case 'hour':
      start = new Date(now);
      start.setMinutes(0, 0, 0);
      end = new Date(start);
      end.setHours(end.getHours() + 1);
      break;
    
    case 'day':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;
    
    case 'week':
      start = new Date(now);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;
    
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    
    case 'lifetime':
      start = new Date(0); // Beginning of time
      end = new Date(2100, 0, 1); // Far future
      break;
    
    default:
      // Default to daily
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
  }

  return {
    start: start.getTime(),
    end: end.getTime()
  };
}