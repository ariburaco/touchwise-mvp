import { authedQuery } from './helpers/queryHelpers';
import type { Id } from './_generated/dataModel';

// Get current usage for the user
export const getCurrentUsage = authedQuery({
  args: {},
  handler: async (ctx) => {
    const tracking = await ctx.db
      .query('usageTracking')
      .withIndex('by_user_metric', (q) => q.eq('userId', ctx.userId as Id<'users'>))
      .collect();

    // Filter to only include current period tracking
    const now = Date.now();
    return tracking.filter(t => {
      if (!t.periodEnd) return true;
      return t.periodEnd > now;
    });
  },
});