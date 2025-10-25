import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { authedMutation, authedQuery } from './helpers/queryHelpers';

/**
 * Create a new notification
 */
export const create = authedMutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.optional(
      v.union(
        v.literal('info'),
        v.literal('success'),
        v.literal('warning'),
        v.literal('error'),
        v.literal('system')
      )
    ),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert('notifications', {
      userId: ctx.userId,
      title: args.title,
      message: args.message,
      type: args.type || 'info',
      read: false,
      actionUrl: args.actionUrl,
      actionText: args.actionText,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Create notification for a specific user (internal use)
 */
export const createForUser = internalMutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    message: v.string(),
    type: v.optional(
      v.union(
        v.literal('info'),
        v.literal('success'),
        v.literal('warning'),
        v.literal('error'),
        v.literal('system')
      )
    ),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert('notifications', {
      userId: args.userId,
      title: args.title,
      message: args.message,
      type: args.type || 'info',
      read: false,
      actionUrl: args.actionUrl,
      actionText: args.actionText,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Get all notifications for the current user
 */
export const getAll = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Get unread notifications count
 */
export const getUnreadCount = authedQuery({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_unread', (q) =>
        q.eq('userId', ctx.userId).eq('read', false)
      )
      .collect();

    return unread.length;
  },
});

/**
 * Get unread notifications
 */
export const getUnread = authedQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user_unread', (q) =>
        q.eq('userId', ctx.userId).eq('read', false)
      )
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Mark a notification as read
 */
export const markAsRead = authedMutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== ctx.userId) {
      throw new Error('Unauthorized');
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
    });

    return { success: true };
  },
});

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = authedMutation({
  args: {
    notificationIds: v.array(v.id('notifications')),
  },
  handler: async (ctx, args) => {
    for (const id of args.notificationIds) {
      const notification = await ctx.db.get(id);

      if (notification && notification.userId === ctx.userId) {
        await ctx.db.patch(id, {
          read: true,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = authedMutation({
  args: {},
  handler: async (ctx) => {
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_unread', (q) =>
        q.eq('userId', ctx.userId).eq('read', false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }

    return {
      success: true,
      count: unread.length,
    };
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = authedMutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId !== ctx.userId) {
      throw new Error('Unauthorized');
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

/**
 * Delete all notifications for the current user
 */
export const deleteAll = authedMutation({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return {
      success: true,
      count: notifications.length,
    };
  },
});

/**
 * Subscribe to notifications for real-time updates
 */
export const subscribe = authedQuery({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .order('desc')
      .take(1);

    return notifications[0] || null;
  },
});
