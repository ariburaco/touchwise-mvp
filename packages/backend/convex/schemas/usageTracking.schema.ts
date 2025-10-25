import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usageTracking = defineTable({
  // User reference
  userId: v.id('users'),
  
  // Metric identification
  metricType: v.string(), // "api_calls", "ai_tokens", etc.
  feature: v.optional(v.string()), // Specific feature being tracked
  
  // Period configuration
  currentPeriod: v.union(
    v.literal('minute'),
    v.literal('hour'),
    v.literal('day'),
    v.literal('week'),
    v.literal('month'),
    v.literal('year')
  ),
  periodStart: v.number(),
  periodEnd: v.number(),
  
  // Usage metrics
  consumed: v.number(), // Amount consumed in current period
  remaining: v.number(), // Amount remaining
  limit: v.number(), // Current limit for this period
  
  // Credit usage
  creditsUsed: v.optional(v.number()), // Credits consumed
  creditsRemaining: v.optional(v.number()), // Credits available
  
  // Status tracking
  status: v.union(
    v.literal('normal'),    // Under limit
    v.literal('warning'),   // Approaching limit
    v.literal('exceeded'),  // Over soft limit
    v.literal('blocked'),   // Hard limit reached
    v.literal('grace')      // In grace period
  ),
  
  // Warning management
  lastWarningAt: v.optional(v.number()),
  warningCount: v.optional(v.number()), // Number of warnings sent
  lastWarningLevel: v.optional(v.number()), // Last warning threshold (80%, 90%, etc.)
  
  // Blocking
  blockedAt: v.optional(v.number()),
  blockReason: v.optional(v.string()),
  unblockAt: v.optional(v.number()), // When to automatically unblock
  
  // Polar integration
  polarMeterId: v.optional(v.string()),
  lastSyncedAt: v.optional(v.number()),
  syncStatus: v.optional(
    v.union(
      v.literal('pending'),
      v.literal('synced'),
      v.literal('failed')
    )
  ),
  
  // Rule reference
  appliedRuleId: v.optional(v.string()), // Which rule is being applied
  
  // Metadata
  metadata: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user_metric', ['userId', 'metricType', 'currentPeriod'])
  .index('by_user_status', ['userId', 'status'])
  .index('by_period', ['periodEnd', 'currentPeriod'])
  .index('by_sync_status', ['syncStatus', 'lastSyncedAt'])
  .index('by_blocked', ['blockedAt', 'unblockAt']);