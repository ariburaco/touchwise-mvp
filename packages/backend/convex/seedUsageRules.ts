import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Default usage rules for different subscription tiers
 * This can be run as a one-time setup or migration
 */
export const seedDefaultRules = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Define default rules for each tier
    const defaultRules = [
      // FREE TIER RULES
      {
        ruleId: 'free_api_calls',
        name: 'API Calls - Free Tier',
        metricType: 'api_calls' as const,
        tierLevel: 'free' as const,
        limitType: 'hard' as const,
        limitValue: 1000,
        limitPeriod: 'month' as const,
        includesCredits: 0,
        overageAllowed: false,
        warningThreshold: 80,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '1,000 API calls per month for free users',
      },
      {
        ruleId: 'free_ai_tokens',
        name: 'AI Tokens - Free Tier',
        metricType: 'ai_tokens' as const,
        tierLevel: 'free' as const,
        limitType: 'hard' as const,
        limitValue: 10000,
        limitPeriod: 'month' as const,
        includesCredits: 0,
        overageAllowed: false,
        warningThreshold: 75,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '10,000 AI tokens per month for free users',
      },
      {
        ruleId: 'free_storage',
        name: 'Storage - Free Tier',
        metricType: 'storage' as const,
        tierLevel: 'free' as const,
        limitType: 'hard' as const,
        limitValue: 100 * 1024 * 1024, // 100 MB in bytes
        limitPeriod: 'lifetime' as const,
        includesCredits: 0,
        overageAllowed: false,
        warningThreshold: 90,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '100 MB total storage for free users',
      },
      {
        ruleId: 'free_email_sends',
        name: 'Email Sends - Free Tier',
        metricType: 'email_sends' as const,
        tierLevel: 'free' as const,
        limitType: 'hard' as const,
        limitValue: 10,
        limitPeriod: 'day' as const,
        includesCredits: 0,
        overageAllowed: false,
        warningThreshold: 70,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '10 emails per day for free users',
      },
      
      // PRO TIER RULES
      {
        ruleId: 'pro_api_calls',
        name: 'API Calls - Pro Tier',
        metricType: 'api_calls' as const,
        tierLevel: 'pro' as const,
        limitType: 'soft' as const,
        limitValue: 50000,
        limitPeriod: 'month' as const,
        includesCredits: 10000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        maxRollover: 20000,
        overageAllowed: true,
        overagePricePerUnit: 0.0001, // $0.10 per 1000 calls
        warningThreshold: 80,
        gracePeriod: 5000, // Extra 5000 calls in grace period
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '50,000 API calls per month with 10,000 rollover credits',
      },
      {
        ruleId: 'pro_ai_tokens',
        name: 'AI Tokens - Pro Tier',
        metricType: 'ai_tokens' as const,
        tierLevel: 'pro' as const,
        limitType: 'soft' as const,
        limitValue: 500000,
        limitPeriod: 'month' as const,
        includesCredits: 100000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        maxRollover: 200000,
        overageAllowed: true,
        overagePricePerUnit: 0.00002, // $0.02 per 1000 tokens
        warningThreshold: 75,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '500,000 AI tokens per month with rollover',
      },
      {
        ruleId: 'pro_storage',
        name: 'Storage - Pro Tier',
        metricType: 'storage' as const,
        tierLevel: 'pro' as const,
        limitType: 'soft' as const,
        limitValue: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
        limitPeriod: 'lifetime' as const,
        overageAllowed: true,
        overagePricePerUnit: 0.1 / (1024 * 1024 * 1024), // $0.10 per GB
        warningThreshold: 85,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '10 GB storage with overage allowed',
      },
      {
        ruleId: 'pro_email_sends',
        name: 'Email Sends - Pro Tier',
        metricType: 'email_sends' as const,
        tierLevel: 'pro' as const,
        limitType: 'soft' as const,
        limitValue: 1000,
        limitPeriod: 'day' as const,
        includesCredits: 100,
        creditRefreshPeriod: 'daily' as const,
        rolloverCredits: false,
        overageAllowed: true,
        overagePricePerUnit: 0.001, // $0.001 per email
        warningThreshold: 80,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '1,000 emails per day for pro users',
      },
      
      // TEAM TIER RULES
      {
        ruleId: 'team_api_calls',
        name: 'API Calls - Team Tier',
        metricType: 'api_calls' as const,
        tierLevel: 'team' as const,
        limitType: 'soft' as const,
        limitValue: 500000,
        limitPeriod: 'month' as const,
        includesCredits: 50000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        maxRollover: 100000,
        overageAllowed: true,
        overagePricePerUnit: 0.00008,
        warningThreshold: 85,
        gracePeriod: 50000,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '500,000 API calls per month for teams',
      },
      {
        ruleId: 'team_ai_tokens',
        name: 'AI Tokens - Team Tier',
        metricType: 'ai_tokens' as const,
        tierLevel: 'team' as const,
        limitType: 'soft' as const,
        limitValue: 2000000,
        limitPeriod: 'month' as const,
        includesCredits: 500000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        maxRollover: 1000000,
        overageAllowed: true,
        overagePricePerUnit: 0.000015,
        warningThreshold: 80,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '2M AI tokens per month for teams',
      },
      {
        ruleId: 'team_storage',
        name: 'Storage - Team Tier',
        metricType: 'storage' as const,
        tierLevel: 'team' as const,
        limitType: 'soft' as const,
        limitValue: 100 * 1024 * 1024 * 1024, // 100 GB
        limitPeriod: 'lifetime' as const,
        overageAllowed: true,
        overagePricePerUnit: 0.08 / (1024 * 1024 * 1024),
        warningThreshold: 85,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '100 GB storage for teams',
      },
      
      // ENTERPRISE TIER RULES
      {
        ruleId: 'enterprise_api_calls',
        name: 'API Calls - Enterprise',
        metricType: 'api_calls' as const,
        tierLevel: 'enterprise' as const,
        limitType: 'soft' as const,
        limitValue: Number.MAX_SAFE_INTEGER,
        limitPeriod: 'month' as const,
        includesCredits: 1000000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        overageAllowed: true,
        overagePricePerUnit: 0.00005,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: 'Unlimited API calls for enterprise',
      },
      {
        ruleId: 'enterprise_ai_tokens',
        name: 'AI Tokens - Enterprise',
        metricType: 'ai_tokens' as const,
        tierLevel: 'enterprise' as const,
        limitType: 'soft' as const,
        limitValue: Number.MAX_SAFE_INTEGER,
        limitPeriod: 'month' as const,
        includesCredits: 10000000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        overageAllowed: true,
        overagePricePerUnit: 0.00001,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: 'Unlimited AI tokens for enterprise',
      },
      
      // LIFETIME TIER RULES
      {
        ruleId: 'lifetime_api_calls',
        name: 'API Calls - Lifetime',
        metricType: 'api_calls' as const,
        tierLevel: 'lifetime' as const,
        limitType: 'soft' as const,
        limitValue: 100000,
        limitPeriod: 'month' as const,
        includesCredits: 20000,
        creditRefreshPeriod: 'monthly' as const,
        rolloverCredits: true,
        maxRollover: 50000,
        overageAllowed: true,
        overagePricePerUnit: 0.00008,
        warningThreshold: 85,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: 'Lifetime access with generous limits',
      },
      {
        ruleId: 'lifetime_storage',
        name: 'Storage - Lifetime',
        metricType: 'storage' as const,
        tierLevel: 'lifetime' as const,
        limitType: 'soft' as const,
        limitValue: 50 * 1024 * 1024 * 1024, // 50 GB
        limitPeriod: 'lifetime' as const,
        overageAllowed: true,
        overagePricePerUnit: 0.05 / (1024 * 1024 * 1024),
        warningThreshold: 90,
        priority: 100,
        isActive: true,
        isDefault: true,
        description: '50 GB lifetime storage',
      },
    ];

    // Insert rules that don't already exist
    const insertedRules = [];
    const skippedRules = [];
    
    for (const rule of defaultRules) {
      const existing = await ctx.db
        .query('usageRules')
        .withIndex('by_rule_id', (q) => q.eq('ruleId', rule.ruleId))
        .first();
      
      if (!existing) {
        await ctx.db.insert('usageRules', {
          ...rule,
          createdAt: now,
          updatedAt: now,
        });
        insertedRules.push(rule.ruleId);
      } else {
        skippedRules.push(rule.ruleId);
      }
    }
    
    return {
      inserted: insertedRules.length,
      skipped: skippedRules.length,
      insertedRules,
      skippedRules,
    };
  },
});

/**
 * Update rule limits (for admin use)
 */
export const updateRuleLimit = internalMutation({
  args: {
    ruleId: v.string(),
    limitValue: v.number(),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query('usageRules')
      .withIndex('by_rule_id', (q) => q.eq('ruleId', args.ruleId))
      .first();
    
    if (!rule) {
      throw new Error(`Rule ${args.ruleId} not found`);
    }
    
    await ctx.db.patch(rule._id, {
      limitValue: args.limitValue,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Activate/deactivate a rule
 */
export const toggleRule = internalMutation({
  args: {
    ruleId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query('usageRules')
      .withIndex('by_rule_id', (q) => q.eq('ruleId', args.ruleId))
      .first();
    
    if (!rule) {
      throw new Error(`Rule ${args.ruleId} not found`);
    }
    
    await ctx.db.patch(rule._id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});