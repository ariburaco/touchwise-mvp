import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const subscriptions = defineTable({
  // User reference
  userId: v.id('users'),
  
  // Polar IDs
  polarCustomerId: v.string(),
  polarSubscriptionId: v.string(),
  
  // Product info
  productId: v.string(),
  productName: v.string(),
  
  // Status
  status: v.union(
    v.literal('incomplete'),
    v.literal('incomplete_expired'),
    v.literal('trialing'),
    v.literal('active'),
    v.literal('past_due'),
    v.literal('canceled'),
    v.literal('unpaid'),
    v.literal('paused'),
  ),
  
  // Billing period
  currentPeriodStart: v.number(),
  currentPeriodEnd: v.number(),
  
  // Trial info
  trialStart: v.optional(v.number()),
  trialEnd: v.optional(v.number()),
  
  // Cancellation
  cancelAtPeriodEnd: v.optional(v.boolean()),
  canceledAt: v.optional(v.number()),
  
  // Metadata
  metadata: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_polar_customer', ['polarCustomerId'])
  .index('by_polar_subscription', ['polarSubscriptionId'])
  .index('by_status', ['status']);