import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const activityLogs = defineTable({
  userId: v.optional(v.id('users')), // Optional for system events
  action: v.string(),
  description: v.string(),
  metadata: v.optional(v.any()),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  timestamp: v.number(),
})
  .index('by_user', ['userId', 'timestamp'])
  .index('by_action', ['action', 'timestamp'])
  .index('by_timestamp', ['timestamp']);