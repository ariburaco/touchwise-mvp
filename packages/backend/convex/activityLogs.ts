import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { authedQuery } from './helpers/queryHelpers';

/**
 * Log an activity (internal use only)
 */
export const logActivity = internalMutation({
  args: {
    userId: v.optional(v.id('users')),
    action: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('activityLogs', {
      userId: args.userId,
      action: args.action,
      description: args.description,
      metadata: args.metadata,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get activity logs for the current user
 */
export const getUserActivities = authedQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const activities = await ctx.db
      .query('activityLogs')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId as any))
      .order('desc')
      .collect();

    return activities.slice(offset, offset + limit);
  },
});

/**
 * Get all activity logs (admin only)
 */
export const getAllActivities = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    userId: v.optional(v.id('users')),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const offset = args.offset || 0;

    let activities;
    
    if (args.userId) {
      activities = await ctx.db
        .query('activityLogs')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .order('desc')
        .collect();
    } else if (args.action) {
      activities = await ctx.db
        .query('activityLogs')
        .withIndex('by_action', (q) => q.eq('action', args.action!))
        .order('desc')
        .collect();
    } else {
      activities = await ctx.db
        .query('activityLogs')
        .withIndex('by_timestamp')
        .order('desc')
        .collect();
    }

    return activities.slice(offset, offset + limit);
  },
});

/**
 * Get activity statistics
 */
export const getActivityStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);

    const activities = await ctx.db
      .query('activityLogs')
      .withIndex('by_timestamp', (q) => q.gte('timestamp', since))
      .collect();

    // Group by action
    const byAction = activities.reduce((acc, activity) => {
      acc[activity.action] = (acc[activity.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by day
    const byDay = activities.reduce((acc, activity) => {
      const day = new Date(activity.timestamp).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: activities.length,
      byAction,
      byDay,
      uniqueUsers: new Set(activities.map(a => a.userId).filter(Boolean)).size,
    };
  },
});

/**
 * Common activity logging helpers
 */
export const activities = {
  USER_SIGNUP: 'user.signup',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_UPDATE_PROFILE: 'user.update_profile',
  USER_UPDATE_AVATAR: 'user.update_avatar',
  USER_UPDATE_SETTINGS: 'user.update_settings',
  USER_DELETE_ACCOUNT: 'user.delete_account',
  
  PASSWORD_CHANGE: 'password.change',
  PASSWORD_RESET_REQUEST: 'password.reset_request',
  PASSWORD_RESET_COMPLETE: 'password.reset_complete',
  
  EMAIL_VERIFICATION_SENT: 'email.verification_sent',
  EMAIL_VERIFIED: 'email.verified',
  
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_DELETED: 'notification.deleted',
  
  SESSION_CREATED: 'session.created',
  SESSION_EXPIRED: 'session.expired',
  SESSION_REVOKED: 'session.revoked',
};