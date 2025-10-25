import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const notifications = defineTable({
  userId: v.id('users'),
  title: v.string(),
  message: v.string(),
  type: v.union(
    v.literal('info'),
    v.literal('success'),
    v.literal('warning'),
    v.literal('error'),
    v.literal('system')
  ),
  read: v.boolean(),
  actionUrl: v.optional(v.string()),
  actionText: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
})
  .index('by_user', ['userId', 'createdAt'])
  .index('by_user_unread', ['userId', 'read', 'createdAt']);