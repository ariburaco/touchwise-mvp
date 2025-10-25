import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const users = defineTable({
  // Basic fields
  name: v.string(),
  email: v.string(),
  
  // Profile fields
  bio: v.optional(v.string()),
  avatar: v.optional(v.string()),
  location: v.optional(v.string()),
  website: v.optional(v.string()),
  phone: v.optional(v.string()),
  
  // Status fields
  emailVerified: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
  lastSeenAt: v.optional(v.number()),
  
  // Auth linking
  betterAuthUserId: v.optional(v.string()), // Better Auth user ID for linking
  
  // Subscription/billing
  polarCustomerId: v.optional(v.string()),
  subscriptionTier: v.optional(v.union(
    v.literal('free'),
    v.literal('pro'),
    v.literal('team'),
    v.literal('enterprise'),
    v.literal('lifetime'),
  )),
  
  // Lifetime access
  hasLifetimeAccess: v.optional(v.boolean()),
  lifetimePurchaseDate: v.optional(v.number()),
  
  // Metadata
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  .index('by_email', ['email'])
  .index('by_name', ['name']);