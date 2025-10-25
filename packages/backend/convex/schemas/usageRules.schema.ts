import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usageRules = defineTable({
  // Rule identification
  ruleId: v.string(), // Unique identifier like "api_calls_free_tier"
  name: v.string(), // Human-readable name
  
  // Metric configuration
  metricType: v.union(
    v.literal('api_calls'),
    v.literal('storage'),
    v.literal('ai_tokens'),
    v.literal('bandwidth'),
    v.literal('database_operations'),
    v.literal('email_sends'),
    v.literal('custom')
  ),
  
  // Tier targeting
  tierLevel: v.union(
    v.literal('free'),
    v.literal('pro'),
    v.literal('team'),
    v.literal('enterprise'),
    v.literal('lifetime'),
    v.literal('custom')
  ),
  
  // Limits configuration
  limitType: v.union(
    v.literal('hard'), // Block when exceeded
    v.literal('soft')  // Allow with warning/overage
  ),
  limitValue: v.number(), // Numerical limit
  limitPeriod: v.union(
    v.literal('minute'),
    v.literal('hour'),
    v.literal('day'),
    v.literal('week'),
    v.literal('month'),
    v.literal('year'),
    v.literal('lifetime')
  ),
  
  // Credits configuration
  includesCredits: v.optional(v.number()), // Base credits included
  creditRefreshPeriod: v.optional(
    v.union(
      v.literal('daily'),
      v.literal('weekly'),
      v.literal('monthly'),
      v.literal('yearly'),
      v.literal('never')
    )
  ),
  rolloverCredits: v.optional(v.boolean()), // Can unused credits roll over?
  maxRollover: v.optional(v.number()), // Maximum credits that can accumulate
  
  // Enforcement settings
  gracePeriod: v.optional(v.number()), // Extra usage allowed before hard stop
  warningThreshold: v.optional(v.number()), // Percentage of limit to trigger warning (e.g., 80)
  
  // Overage pricing
  overageAllowed: v.boolean(),
  overagePricePerUnit: v.optional(v.number()), // Cost per unit over limit
  overageCurrency: v.optional(v.string()), // Currency for overage (default: USD)
  
  // Feature targeting
  features: v.optional(v.array(v.string())), // Specific features this rule applies to
  excludedFeatures: v.optional(v.array(v.string())), // Features to exclude from this rule
  
  // Rule management
  priority: v.number(), // Higher priority rules are evaluated first
  isActive: v.boolean(),
  isDefault: v.optional(v.boolean()), // Is this a default rule for the tier?
  
  // Metadata
  description: v.optional(v.string()),
  metadata: v.optional(v.any()),
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  effectiveFrom: v.optional(v.number()), // When this rule becomes active
  effectiveUntil: v.optional(v.number()), // When this rule expires
})
  .index('by_rule_id', ['ruleId'])
  .index('by_tier', ['tierLevel', 'isActive'])
  .index('by_metric_tier', ['metricType', 'tierLevel', 'isActive'])
  .index('by_priority', ['priority', 'isActive']);