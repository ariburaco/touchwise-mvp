import { authedQuery } from './helpers/queryHelpers';

// Get active rules for the user's tier
export const getActiveRules = authedQuery({
  args: {},
  handler: async (ctx) => {
    const userTier = ctx.user.subscriptionTier || 'free';

    // Get rules specifically for the user's tier
    const rules = await ctx.db
      .query('usageRules')
      .withIndex('by_tier', (q) => 
        q.eq('tierLevel', userTier as 'free' | 'pro' | 'team' | 'enterprise')
          .eq('isActive', true)
      )
      .collect();

    // Sort by priority (lower number = higher priority)
    return rules.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  },
});
