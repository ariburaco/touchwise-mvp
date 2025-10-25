import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const leads = defineTable({
  // Relationship
  companyId: v.id('companies'),

  // Lead link
  url: v.string(),

  // Crawling status
  status: v.union(
    v.literal('pending'),
    v.literal('processing'),
    v.literal('completed'),
    v.literal('failed'),
  ),

  // Extracted data
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  knowledgeBase: v.optional(v.string()), // JSON string or text content

  // Error tracking
  errorMessage: v.optional(v.string()),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  processedAt: v.optional(v.number()),
})
  .index('by_company', ['companyId'])
  .index('by_status', ['status'])
  .index('by_company_status', ['companyId', 'status']);
