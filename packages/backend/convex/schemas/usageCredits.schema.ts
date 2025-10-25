import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usageCredits = defineTable({
  // User reference
  userId: v.id('users'),
  
  // Credit type
  creditType: v.string(), // "api_calls", "ai_tokens", "storage", etc.
  
  // Credit balance
  availableCredits: v.number(), // Current available credits
  usedCredits: v.number(), // Credits used in current period
  totalAllocated: v.number(), // Total credits allocated
  reservedCredits: v.optional(v.number()), // Credits reserved for pending operations
  
  // Time tracking
  periodStart: v.number(),
  periodEnd: v.number(),
  expiresAt: v.optional(v.number()), // When credits expire
  
  // Source tracking
  source: v.union(
    v.literal('subscription'), // From subscription plan
    v.literal('purchase'),     // One-time purchase
    v.literal('promotion'),    // Promotional credits
    v.literal('bonus'),        // Bonus credits
    v.literal('rollover'),     // Rolled over from previous period
    v.literal('compensation')  // Compensation/refund credits
  ),
  sourceReference: v.optional(v.string()), // Reference ID (subscription ID, order ID, etc.)
  
  // Rollover configuration
  canRollover: v.boolean(),
  rolloverAmount: v.optional(v.number()), // Amount that can be rolled over
  rolledOverFrom: v.optional(v.id('usageCredits')), // Previous credit record if rolled over
  
  // Metadata
  metadata: v.optional(v.any()),
  notes: v.optional(v.string()), // Admin notes
  
  // Status
  isActive: v.boolean(),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  lastUsedAt: v.optional(v.number()),
})
  .index('by_user', ['userId', 'creditType', 'isActive'])
  .index('by_user_active', ['userId', 'isActive'])
  .index('by_expiry', ['expiresAt', 'isActive'])
  .index('by_source', ['source', 'sourceReference']);