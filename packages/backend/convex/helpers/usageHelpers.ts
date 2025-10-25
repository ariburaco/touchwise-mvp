import { ConvexError, v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx, ActionCtx } from '../_generated/server';
import { checkUsage, trackUsage, getUsageSummary } from '../services/usageManager';
import { getCreditBalance } from '../services/creditManager';
import { customMutation } from 'convex-helpers/server/customFunctions';
import { mutation as baseMutation } from '../_generated/server';

// Extended context with usage tracking
export type UsageCtx = {
  userId: Id<'users'>;
  checkUsage: (metricType: string, amount: number, feature?: string) => Promise<boolean>;
  trackUsage: (params: {
    eventType: string;
    metricType: string;
    amount: number;
    feature?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  getCredits: (creditType?: string) => Promise<number>;
};

// Check usage before an operation
export async function checkUsageLimit(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  metricType: string,
  amount: number,
  feature?: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const result = await checkUsage(ctx, {
    userId,
    metricType,
    amount,
    feature
  });

  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.reason || 'Usage limit exceeded',
      remaining: result.remaining || 0
    };
  }

  // Show warning if approaching limit
  if (result.shouldWarn) {
    console.warn(result.warningMessage);
  }

  return {
    allowed: true,
    remaining: result.remaining
  };
}

// Track usage after an operation
export async function recordUsage(
  ctx: MutationCtx,
  userId: Id<'users'>,
  params: {
    eventType: string;
    metricType: string;
    amount: number;
    feature?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
    requestId?: string;
    sessionId?: string;
  }
): Promise<void> {
  await trackUsage(ctx, {
    userId,
    ...params
  });
}

// Custom mutation with usage tracking
export const mutationWithUsage = customMutation(baseMutation, {
  args: {
    metricType: v.string(),
    amount: v.number(),
    feature: v.optional(v.string()),
  },
  input: async (ctx: MutationCtx, args: any) => {
    // Get user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new ConvexError('Not authenticated');
    }

    const userId = identity.subject as Id<'users'>;

    // Check usage before proceeding
    const canProceed = await checkUsageLimit(
      ctx,
      userId,
      args.metricType,
      args.amount,
      args.feature
    );

    if (!canProceed.allowed) {
      throw new ConvexError(canProceed.reason || 'Usage limit exceeded');
    }

    // Create extended context
    const extendedCtx = {
      ...ctx,
      userId,
      checkUsage: async (metricType: string, amount: number, feature?: string) => {
        const result = await checkUsageLimit(ctx, userId, metricType, amount, feature);
        return result.allowed;
      },
      trackUsage: async (params: any) => {
        await recordUsage(ctx, userId, params);
      },
      getCredits: async (creditType?: string) => {
        const balance = await getCreditBalance(ctx, userId, creditType);
        return balance.totalAvailable;
      }
    } as MutationCtx & UsageCtx;

    // Remove usage-specific args before passing to handler
    const { metricType, amount, feature, ...handlerArgs } = args;

    return {
      ctx: extendedCtx,
      args: handlerArgs
    };
  }
});

// Get user's current usage status
export async function getUserUsageStatus(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<{
  metrics: Array<{
    type: string;
    used: number;
    limit: number;
    percentUsed: number;
    status: string;
  }>;
  credits: Array<{
    type: string;
    available: number;
    expiresAt?: number;
  }>;
  warnings: string[];
}> {
  const summary = await getUsageSummary(ctx, userId);
  const warnings: string[] = [];

  // Check for warnings
  for (const metric of summary.metrics) {
    if (metric.percentUsed >= 90) {
      warnings.push(`Critical: ${metric.metricType} usage at ${metric.percentUsed.toFixed(0)}%`);
    } else if (metric.percentUsed >= 75) {
      warnings.push(`Warning: ${metric.metricType} usage at ${metric.percentUsed.toFixed(0)}%`);
    }

    if (metric.status === 'exceeded' || metric.status === 'blocked') {
      warnings.push(`${metric.metricType} limit exceeded`);
    }
  }

  // Check for expiring credits
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  
  for (const credit of summary.credits) {
    if (credit.expiresAt && credit.expiresAt - now < threeDays) {
      const daysLeft = Math.ceil((credit.expiresAt - now) / (24 * 60 * 60 * 1000));
      warnings.push(`${credit.creditType} credits expire in ${daysLeft} days`);
    }
  }

  return {
    metrics: summary.metrics.map(m => ({
      type: m.metricType,
      used: m.consumed,
      limit: m.limit,
      percentUsed: m.percentUsed,
      status: m.status
    })),
    credits: summary.credits.map(c => ({
      type: c.creditType,
      available: c.available,
      expiresAt: c.expiresAt
    })),
    warnings
  };
}

// Estimate token usage for AI operations
export function estimateTokens(text: string): number {
  // Simple estimation: ~4 characters per token
  // This should be replaced with actual tokenizer for production
  return Math.ceil(text.length / 4);
}

// Check if user can perform an operation
export async function canUserPerform(
  ctx: QueryCtx,
  userId: Id<'users'>,
  operation: {
    metricType: string;
    estimatedAmount: number;
    feature?: string;
  }
): Promise<boolean> {
  const result = await checkUsageLimit(
    ctx,
    userId,
    operation.metricType,
    operation.estimatedAmount,
    operation.feature
  );
  
  return result.allowed;
}

// Batch check multiple operations
export async function batchCheckUsage(
  ctx: QueryCtx,
  userId: Id<'users'>,
  operations: Array<{
    metricType: string;
    amount: number;
    feature?: string;
  }>
): Promise<{
  allAllowed: boolean;
  results: Array<{
    metricType: string;
    allowed: boolean;
    reason?: string;
  }>;
}> {
  const results = await Promise.all(
    operations.map(async (op) => {
      const result = await checkUsageLimit(
        ctx,
        userId,
        op.metricType,
        op.amount,
        op.feature
      );
      
      return {
        metricType: op.metricType,
        allowed: result.allowed,
        reason: result.reason
      };
    })
  );

  const allAllowed = results.every(r => r.allowed);

  return {
    allAllowed,
    results
  };
}

// Format usage for display
export function formatUsage(
  used: number,
  limit: number,
  metricType: string
): string {
  const percentage = (used / limit) * 100;
  
  switch (metricType) {
    case 'api_calls':
      return `${used.toLocaleString()} / ${limit.toLocaleString()} API calls (${percentage.toFixed(0)}%)`;
    
    case 'ai_tokens':
      return `${used.toLocaleString()} / ${limit.toLocaleString()} tokens (${percentage.toFixed(0)}%)`;
    
    case 'storage':
      return `${formatBytes(used)} / ${formatBytes(limit)} (${percentage.toFixed(0)}%)`;
    
    case 'bandwidth':
      return `${formatBytes(used)} / ${formatBytes(limit)} (${percentage.toFixed(0)}%)`;
    
    default:
      return `${used.toLocaleString()} / ${limit.toLocaleString()} ${metricType} (${percentage.toFixed(0)}%)`;
  }
}

// Format bytes for display
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}