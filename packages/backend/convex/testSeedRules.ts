import { v } from 'convex/values';
import { authedMutation } from './helpers/queryHelpers';
import type { Id } from './_generated/dataModel';

// Test mutation to seed sample rules for testing
export const seedTestRules = authedMutation({
  args: {
    tier: v.optional(v.union(v.literal('free'), v.literal('pro'), v.literal('team'), v.literal('enterprise'))),
    clearFirst: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tierToSeed = args.tier || 'free';
    const now = Date.now();
    
    // Clear existing rules for this tier if requested
    if (args.clearFirst) {
      const existingRules = await ctx.db
        .query('usageRules')
        .withIndex('by_tier', (q) => 
          q.eq('tierLevel', tierToSeed as 'free' | 'pro' | 'team' | 'enterprise')
            .eq('isActive', true)
        )
        .collect();
      
      for (const rule of existingRules) {
        await ctx.db.delete(rule._id);
      }
      
      // Also clear tracking records for current user to force recreation
      const tracking = await ctx.db
        .query('usageTracking')
        .withIndex('by_user_metric', (q) => q.eq('userId', ctx.userId as Id<'users'>))
        .collect();
      
      for (const track of tracking) {
        await ctx.db.delete(track._id);
      }
    }
    
    // Sample rules for testing
    const testRules = [
      // API Calls
      {
        ruleId: `${tierToSeed}_api_calls_daily`,
        name: `API Calls - ${tierToSeed} Daily`,
        metricType: 'api_calls' as const,
        tierLevel: tierToSeed as 'free' | 'pro' | 'team' | 'enterprise',
        limitType: tierToSeed === 'free' ? ('hard' as const) : ('soft' as const),
        limitValue: tierToSeed === 'free' ? 100 : tierToSeed === 'pro' ? 5000 : 50000,
        limitPeriod: 'day' as const,
        includesCredits: tierToSeed === 'free' ? 0 : tierToSeed === 'pro' ? 100 : 1000,
        overageAllowed: tierToSeed !== 'free',
        overagePricePerUnit: tierToSeed === 'free' ? undefined : 0.001,
        description: `Daily API call limit for ${tierToSeed} tier`,
        isActive: true,
        priority: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        ruleId: `${tierToSeed}_api_calls_monthly`,
        name: `API Calls - ${tierToSeed} Monthly`,
        metricType: 'api_calls' as const,
        tierLevel: tierToSeed as 'free' | 'pro' | 'team' | 'enterprise',
        limitType: tierToSeed === 'free' ? ('hard' as const) : ('soft' as const),
        limitValue: tierToSeed === 'free' ? 2000 : tierToSeed === 'pro' ? 100000 : 1000000,
        limitPeriod: 'month' as const,
        includesCredits: tierToSeed === 'free' ? 0 : tierToSeed === 'pro' ? 500 : 5000,
        overageAllowed: tierToSeed !== 'free',
        overagePricePerUnit: tierToSeed === 'free' ? undefined : 0.0005,
        description: `Monthly API call limit for ${tierToSeed} tier`,
        isActive: true,
        priority: 2,
        createdAt: now,
        updatedAt: now,
      },
      // AI Tokens - IMPORTANT: Pro tier gets 100,000 tokens per month
      {
        ruleId: `${tierToSeed}_ai_tokens_monthly`,
        name: `AI Tokens - ${tierToSeed} Monthly`,
        metricType: 'ai_tokens' as const,
        tierLevel: tierToSeed as 'free' | 'pro' | 'team' | 'enterprise',
        limitType: tierToSeed === 'free' ? ('hard' as const) : ('soft' as const),
        limitValue: tierToSeed === 'free' ? 1000 : tierToSeed === 'pro' ? 100000 : 1000000, // Pro: 100K tokens
        limitPeriod: 'month' as const,
        includesCredits: tierToSeed === 'free' ? 0 : tierToSeed === 'pro' ? 1000 : 10000,
        overageAllowed: tierToSeed !== 'free',
        overagePricePerUnit: tierToSeed === 'free' ? undefined : 0.00002,
        description: `Monthly AI token limit for ${tierToSeed} tier`,
        isActive: true,
        priority: 1,
        createdAt: now,
        updatedAt: now,
        warningThreshold: 80, // Warn at 80% usage
      },
      // Storage
      {
        ruleId: `${tierToSeed}_storage_lifetime`,
        name: `Storage - ${tierToSeed} Lifetime`,
        metricType: 'storage' as const,
        tierLevel: tierToSeed as 'free' | 'pro' | 'team' | 'enterprise',
        limitType: tierToSeed === 'free' ? ('hard' as const) : ('soft' as const),
        limitValue: tierToSeed === 'free' ? 1024 * 1024 * 100 : // 100MB
                tierToSeed === 'pro' ? 1024 * 1024 * 1024 * 10 : // 10GB
                1024 * 1024 * 1024 * 100, // 100GB
        limitPeriod: 'lifetime' as const,
        includesCredits: 0,
        overageAllowed: tierToSeed !== 'free',
        overagePricePerUnit: tierToSeed === 'free' ? undefined : 0.05,
        description: `Storage limit for ${tierToSeed} tier`,
        isActive: true,
        priority: 1,
        createdAt: now,
        updatedAt: now,
      },
      // Email Sends
      {
        ruleId: `${tierToSeed}_email_sends_daily`,
        name: `Email Sends - ${tierToSeed} Daily`,
        metricType: 'email_sends' as const,
        tierLevel: tierToSeed as 'free' | 'pro' | 'team' | 'enterprise',
        limitType: tierToSeed === 'free' ? ('hard' as const) : ('soft' as const),
        limitValue: tierToSeed === 'free' ? 5 : tierToSeed === 'pro' ? 100 : 1000,
        limitPeriod: 'day' as const,
        includesCredits: tierToSeed === 'free' ? 0 : tierToSeed === 'pro' ? 10 : 100,
        overageAllowed: tierToSeed !== 'free',
        overagePricePerUnit: tierToSeed === 'free' ? undefined : 0.01,
        description: `Daily email send limit for ${tierToSeed} tier`,
        isActive: true,
        priority: 1,
        createdAt: now,
        updatedAt: now,
      },
      // Database Operations
      {
        ruleId: `${tierToSeed}_database_ops_hourly`,
        name: `Database Ops - ${tierToSeed} Hourly`,
        metricType: 'database_operations' as const,
        tierLevel: tierToSeed as 'free' | 'pro' | 'team' | 'enterprise',
        limitType: 'soft' as const,
        limitValue: tierToSeed === 'free' ? 100 : tierToSeed === 'pro' ? 10000 : 100000,
        limitPeriod: 'hour' as const,
        includesCredits: 0,
        overageAllowed: true,
        overagePricePerUnit: tierToSeed === 'free' ? undefined : 0.0001,
        description: `Hourly database operation limit for ${tierToSeed} tier`,
        isActive: true,
        priority: 1,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Insert the rules
    const insertedRules = [];
    for (const rule of testRules) {
      const id = await ctx.db.insert('usageRules', rule);
      insertedRules.push(id);
    }

    return {
      success: true,
      message: `Seeded ${insertedRules.length} test rules for ${tierToSeed} tier`,
      ruleCount: insertedRules.length,
      tier: tierToSeed,
    };
  },
});

// Clear all test rules and tracking data
// Synchronize tracking records with current rules
export const syncTrackingWithRules = authedMutation({
  args: {},
  handler: async (ctx) => {
    const userTier = ctx.user.subscriptionTier || 'free';
    
    // Get all active rules for the user's tier
    const rules = await ctx.db
      .query('usageRules')
      .withIndex('by_tier', (q) =>
        q.eq('tierLevel', userTier as 'free' | 'pro' | 'team' | 'enterprise')
          .eq('isActive', true)
      )
      .collect();
    
    // Get all tracking records for the user
    const tracking = await ctx.db
      .query('usageTracking')
      .withIndex('by_user_metric', (q) => q.eq('userId', ctx.userId as Id<'users'>))
      .collect();
    
    let updated = 0;
    
    // Update each tracking record with the correct limit from rules
    for (const track of tracking) {
      // Find the matching rule
      const matchingRule = rules.find(r => 
        r.metricType === track.metricType && 
        r.limitPeriod === track.currentPeriod
      );
      
      if (matchingRule && matchingRule.limitValue !== track.limit) {
        // Update the tracking record with the correct limit
        await ctx.db.patch(track._id, {
          limit: matchingRule.limitValue,
          remaining: Math.max(0, matchingRule.limitValue - track.consumed),
          appliedRuleId: matchingRule.ruleId,
          updatedAt: Date.now()
        });
        updated++;
      }
    }
    
    return {
      success: true,
      message: `Synchronized ${updated} tracking records with current rules`,
      updated,
      tier: userTier
    };
  },
});

export const clearTestRules = authedMutation({
  args: {},
  handler: async (ctx) => {
    // Clear all rules
    const allRules = await ctx.db.query('usageRules').collect();
    
    let deletedRules = 0;
    for (const rule of allRules) {
      await ctx.db.delete(rule._id);
      deletedRules++;
    }
    
    // Clear all tracking records for current user
    const tracking = await ctx.db
      .query('usageTracking')
      .withIndex('by_user_metric', (q) => q.eq('userId', ctx.userId as Id<'users'>))
      .collect();
    
    let deletedTracking = 0;
    for (const track of tracking) {
      await ctx.db.delete(track._id);
      deletedTracking++;
    }
    
    // Clear all usage events for current user (limit to 1000 to avoid timeout)
    const events = await ctx.db
      .query('usageEvents')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId as Id<'users'>))
      .take(1000);
    
    let deletedEvents = 0;
    for (const event of events) {
      await ctx.db.delete(event._id);
      deletedEvents++;
    }

    return {
      success: true,
      message: `Cleared ${deletedRules} rules, ${deletedTracking} tracking records, ${deletedEvents} events`,
      deletedRules,
      deletedTracking,
      deletedEvents,
    };
  },
});