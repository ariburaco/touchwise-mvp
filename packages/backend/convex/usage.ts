import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { authedQuery, authedMutation } from './helpers/queryHelpers';
import { 
  checkUsageLimit, 
  recordUsage, 
  formatUsage
} from './helpers/usageHelpers';
import { 
  getCreditBalance as getCreditBalanceService,
  grantPromotionalCredits 
} from './services/creditManager';
import { getUsageSummary } from './services/usageManager';

// Get user's usage summary
export const getUserUsage = authedQuery({
  args: {},
  handler: async (ctx) => {
    const summary = await getUsageSummary(ctx, ctx.userId);
    const creditBalance = await getCreditBalanceService(ctx, ctx.userId);
    
    // Format for frontend display
    const metrics = summary.metrics.map(m => ({
      type: m.metricType,
      period: m.period,
      used: m.consumed,
      limit: m.limit,
      remaining: m.remaining,
      percentUsed: m.percentUsed,
      status: m.status,
      appliedRuleId: m.appliedRuleId,
      displayText: formatUsage(m.consumed, m.limit, m.metricType)
    }));
    
    const credits = creditBalance.credits.map((c) => ({
      type: c.type,
      available: c.available,
      used: c.used,
      total: c.total,
      expiresAt: c.expiresAt,
      source: c.source,
      displayText: `${c.available.toLocaleString()} credits available`
    }));
    
    // Check for warnings
    const warnings: string[] = [];
    for (const metric of metrics) {
      if (metric.percentUsed >= 90) {
        warnings.push(`⚠️ ${metric.type} usage is at ${metric.percentUsed.toFixed(0)}%`);
      }
    }
    
    // Check for expiring credits
    const now = Date.now();
    for (const credit of credits) {
      if (credit.expiresAt && credit.expiresAt - now < 7 * 24 * 60 * 60 * 1000) {
        const daysLeft = Math.ceil((credit.expiresAt - now) / (24 * 60 * 60 * 1000));
        warnings.push(`⏰ ${credit.type} credits expire in ${daysLeft} days`);
      }
    }
    
    return {
      metrics,
      credits,
      warnings,
      totalCredits: creditBalance.totalAvailable
    };
  },
});

// Check if user can perform an action
export const checkUsageAvailable = authedQuery({
  args: {
    metricType: v.string(),
    amount: v.number(),
    feature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await checkUsageLimit(
      ctx,
      ctx.userId,
      args.metricType,
      args.amount,
      args.feature
    );
    
    return {
      allowed: result.allowed,
      reason: result.reason,
      remaining: result.remaining
    };
  },
});

// Track a usage event
export const trackUsageEvent = authedMutation({
  args: {
    eventType: v.string(),
    metricType: v.string(),
    amount: v.number(),
    feature: v.optional(v.string()),
    endpoint: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await recordUsage(ctx, ctx.userId, {
      eventType: args.eventType,
      metricType: args.metricType,
      amount: args.amount,
      feature: args.feature,
      endpoint: args.endpoint,
      metadata: args.metadata,
    });
    
    return { success: true };
  },
});

// Get credit balance
export const getCreditBalance = authedQuery({
  args: {
    creditType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const balance = await getCreditBalanceService(ctx, ctx.userId, args.creditType);
    
    return {
      credits: balance.credits,
      total: balance.totalAvailable,
      displayText: `${balance.totalAvailable.toLocaleString()} total credits available`
    };
  },
});

// Get usage rules for current tier
export const getUserRules = authedQuery({
  args: {},
  handler: async (ctx) => {
    // Get user to determine tier
    const user = await ctx.db.get(ctx.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const tier = user.subscriptionTier || 'free';
    
    // Get all active rules for this tier
    const rules = await ctx.db
      .query('usageRules')
      .withIndex('by_tier', (q) => 
        q.eq('tierLevel', tier)
          .eq('isActive', true)
      )
      .collect();
    
    // Format rules for display
    return rules.map(rule => ({
      name: rule.name,
      metricType: rule.metricType,
      limit: rule.limitValue,
      period: rule.limitPeriod,
      limitType: rule.limitType,
      includesCredits: rule.includesCredits,
      creditRefreshPeriod: rule.creditRefreshPeriod,
      overageAllowed: rule.overageAllowed,
      overagePrice: rule.overagePricePerUnit,
      description: rule.description
    }));
  },
});

// Get usage history
export const getUsageHistory = authedQuery({
  args: {
    metricType: v.optional(v.string()),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const limit = args.limit || 100;
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    let query = ctx.db
      .query('usageEvents')
      .withIndex('by_user', (q) => 
        q.eq('userId', ctx.userId)
          .gte('timestamp', since)
      );
    
    if (args.metricType) {
      query = query.filter((q) => q.eq(q.field('metricType'), args.metricType));
    }
    
    const events = await query.take(limit);
    
    return events.map(e => ({
      timestamp: e.timestamp,
      eventType: e.eventType,
      metricType: e.metricType,
      amount: e.amount,
      feature: e.feature,
      allowed: e.allowed,
      reason: e.reason,
      cost: e.cost,
    }));
  },
});

// Admin: Grant promotional credits
export const grantPromoCredits = mutation({
  args: {
    userId: v.id('users'),
    creditType: v.string(),
    amount: v.number(),
    reason: v.string(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // This should be restricted to admin users in production
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }
    
    // TODO: Check if user is admin
    // const isAdmin = await checkIfAdmin(ctx, identity.subject);
    // if (!isAdmin) {
    //   throw new Error('Not authorized');
    // }
    
    const creditId = await grantPromotionalCredits(ctx, {
      userId: args.userId,
      creditType: args.creditType,
      amount: args.amount,
      reason: args.reason,
      expiresInDays: args.expiresInDays,
    });
    
    return { success: true, creditId };
  },
});

// Get usage statistics (for analytics)
export const getUsageStats = authedQuery({
  args: {
    period: v.optional(v.union(
      v.literal('day'),
      v.literal('week'),
      v.literal('month'),
      v.literal('year')
    )),
  },
  handler: async (ctx, args) => {
    const period = args.period || 'month';
    let since: number;
    
    const now = Date.now();
    switch (period) {
      case 'day':
        since = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        since = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        since = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        since = now - (365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Get usage events for the period
    const events = await ctx.db
      .query('usageEvents')
      .withIndex('by_user', (q) => 
        q.eq('userId', ctx.userId)
          .gte('timestamp', since)
      )
      .collect();
    
    // Aggregate by metric type
    const statsByType: Record<string, {
      total: number;
      count: number;
      cost: number;
      allowed: number;
      blocked: number;
    }> = {};
    
    for (const event of events) {
      if (!statsByType[event.metricType]) {
        statsByType[event.metricType] = {
          total: 0,
          count: 0,
          cost: 0,
          allowed: 0,
          blocked: 0,
        };
      }
      
      const stats = statsByType[event.metricType];
      stats.total += event.amount;
      stats.count += 1;
      stats.cost += event.cost || 0;
      if (event.allowed) {
        stats.allowed += 1;
      } else {
        stats.blocked += 1;
      }
    }
    
    // Calculate daily averages
    const daysInPeriod = (now - since) / (24 * 60 * 60 * 1000);
    
    return {
      period,
      since,
      metrics: Object.entries(statsByType).map(([type, stats]) => ({
        metricType: type,
        total: stats.total,
        count: stats.count,
        cost: stats.cost,
        allowedCount: stats.allowed,
        blockedCount: stats.blocked,
        dailyAverage: Math.round(stats.total / daysInPeriod),
        successRate: (stats.allowed / stats.count) * 100,
      })),
      totalEvents: events.length,
      totalCost: events.reduce((sum, e) => sum + (e.cost || 0), 0),
    };
  },
});