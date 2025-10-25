import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usageMeters = defineTable({
  // User reference
  userId: v.id('users'),
  
  // Polar IDs
  polarCustomerId: v.string(),
  polarMeterId: v.string(),
  
  // Meter info
  meterName: v.string(),
  meterType: v.string(), // e.g., 'api_calls', 'storage', 'messages'
  
  // Usage data
  consumed: v.number(), // Amount consumed
  balance: v.number(), // Remaining balance
  limit: v.optional(v.number()), // Total limit (if applicable)
  
  // Period
  periodStart: v.number(),
  periodEnd: v.number(),
  
  // Status
  isActive: v.boolean(),
  
  // Metadata
  metadata: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  lastUsedAt: v.optional(v.number()),
})
  .index('by_user', ['userId'])
  .index('by_polar_customer', ['polarCustomerId'])
  .index('by_polar_meter', ['polarMeterId'])
  .index('by_meter_type', ['meterType']);