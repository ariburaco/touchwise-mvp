import { v } from 'convex/values';
import { query } from './_generated/server';
import { getCurrentUser } from './auth';
import type { Id } from './_generated/dataModel';
import { authedQuery } from './helpers/queryHelpers';

// Get recent usage events
export const getRecentEvents = authedQuery({
  args: {
    limit: v.optional(v.number()),
    metricType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    let eventsQuery = ctx.db
      .query('usageEvents')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId as Id<'users'>));

    const events = await eventsQuery.order('desc').take(limit);

    // Filter by metric type if provided
    if (args.metricType) {
      return events.filter((e) => e.metricType === args.metricType);
    }

    return events;
  },
});
