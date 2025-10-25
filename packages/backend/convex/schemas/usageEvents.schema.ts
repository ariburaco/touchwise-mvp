import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usageEvents = defineTable({
  // User reference
  userId: v.id('users'),
  
  // Event identification
  eventId: v.optional(v.string()), // Unique event ID
  eventType: v.string(), // "api_call", "file_upload", "ai_generation", etc.
  metricType: v.string(), // "api_calls", "storage", "ai_tokens", etc.
  
  // Event details
  amount: v.number(), // Units consumed (1 for API call, tokens for AI, bytes for storage)
  endpoint: v.optional(v.string()), // API endpoint if applicable
  method: v.optional(v.string()), // HTTP method if applicable
  feature: v.optional(v.string()), // Feature that triggered usage
  
  // Request context
  requestId: v.optional(v.string()), // Unique request identifier
  sessionId: v.optional(v.string()), // Session identifier
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  referer: v.optional(v.string()),
  
  // Response data
  statusCode: v.optional(v.number()), // HTTP status code
  responseTime: v.optional(v.number()), // Response time in ms
  errorMessage: v.optional(v.string()), // Error if failed
  
  // Authorization
  allowed: v.boolean(), // Was the action allowed?
  reason: v.optional(v.string()), // If blocked, why?
  appliedRuleId: v.optional(v.string()), // Which rule was applied
  
  // Credit usage
  creditsConsumed: v.optional(v.number()),
  creditBalance: v.optional(v.number()), // Balance after consumption
  
  // Polar sync
  polarEventId: v.optional(v.string()),
  syncedToPolar: v.boolean(),
  polarSyncedAt: v.optional(v.number()),
  polarSyncError: v.optional(v.string()),
  
  // Metadata
  metadata: v.optional(v.any()),
  tags: v.optional(v.array(v.string())), // Tags for categorization
  
  // Billing
  billable: v.boolean(), // Is this event billable?
  cost: v.optional(v.number()), // Cost of this event
  currency: v.optional(v.string()), // Currency of cost
  
  // Timestamps
  timestamp: v.number(),
})
  .index('by_user', ['userId', 'timestamp'])
  .index('by_user_metric', ['userId', 'metricType', 'timestamp'])
  .index('by_user_feature', ['userId', 'feature', 'timestamp'])
  .index('by_polar_sync', ['syncedToPolar', 'timestamp'])
  .index('by_event_type', ['eventType', 'timestamp'])
  .index('by_billable', ['billable', 'userId', 'timestamp'])
  .index('by_request', ['requestId']);