import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getCurrentUser } from './auth';
import type { Id } from './_generated/dataModel';
import { authedQuery } from './helpers/queryHelpers';

// Get user's credits
export const getUserCredits = authedQuery({
  args: {},
  handler: async (ctx) => {
    const credits = await ctx.db
      .query('usageCredits')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId as Id<'users'>))
      .collect();

    // Filter out expired credits
    const now = Date.now();
    return credits.filter((c) => !c.expiresAt || c.expiresAt > now);
  },
});

// Get credit history
export const getCreditHistory = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // For now, return credit allocations as history
    // In a real app, you'd have a separate credit_history table
    const credits = await ctx.db
      .query('usageCredits')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId as Id<'users'>))
      .order('desc')
      .take(limit);

    // Transform to history format
    return credits.map((c) => ({
      _id: c._id,
      _creationTime: c._creationTime,
      type:
        c.source === 'purchase'
          ? 'allocation'
          : c.source === 'bonus'
            ? 'allocation'
            : 'allocation',
      amount: c.totalAllocated,
      metricType: c.creditType,
      source: c.source,
    }));
  },
});
