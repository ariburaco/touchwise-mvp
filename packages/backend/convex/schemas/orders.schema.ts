import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const orders = defineTable({
  // User reference
  userId: v.id('users'),
  
  // Polar IDs
  polarCustomerId: v.string(),
  polarOrderId: v.string(),
  
  // Product info
  productId: v.string(),
  productName: v.string(),
  
  // Order details
  amount: v.number(), // Amount in cents
  currency: v.string(), // Currency code (USD, EUR, etc.)
  
  // Type
  billingType: v.union(
    v.literal('one_time'),
    v.literal('recurring'),
  ),
  
  // Status
  status: v.union(
    v.literal('pending'),
    v.literal('completed'),
    v.literal('failed'),
    v.literal('refunded'),
  ),
  
  // Reference
  referenceId: v.optional(v.string()), // For organization-level purchases
  
  // Metadata
  metadata: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_polar_customer', ['polarCustomerId'])
  .index('by_polar_order', ['polarOrderId'])
  .index('by_status', ['status']);