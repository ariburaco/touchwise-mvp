import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const jobQueue = defineTable({
  // Job type
  jobType: v.string(), // 'scrape_lead'

  // Job payload
  leadId: v.id('leads'),

  // Status tracking
  status: v.union(
    v.literal('pending'),
    v.literal('processing'),
    v.literal('completed'),
    v.literal('failed')
  ),

  // Retry logic
  attempts: v.number(),
  maxAttempts: v.optional(v.number()),

  // Error tracking
  error: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index('by_status', ['status'])
  .index('by_status_created', ['status', 'createdAt']);
