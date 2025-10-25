import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chatSessions = defineTable({
  // Relationships
  chatLinkId: v.id('chatLinks'),
  leadId: v.id('leads'),
  companyId: v.id('companies'),

  // Session info
  status: v.union(
    v.literal('active'),
    v.literal('completed'),
    v.literal('abandoned'),
  ),

  // Visitor info (optional)
  visitorName: v.optional(v.string()),
  visitorEmail: v.optional(v.string()),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  endedAt: v.optional(v.number()),
})
  .index('by_link', ['chatLinkId'])
  .index('by_lead', ['leadId'])
  .index('by_company', ['companyId'])
  .index('by_status', ['status']);
