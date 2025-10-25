import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chatLinks = defineTable({
  // Relationship
  leadId: v.id('leads'),
  companyId: v.id('companies'),

  // Unique token for the link
  token: v.string(), // UUID for unique chat link

  // Status
  status: v.union(
    v.literal('active'),
    v.literal('expired'),
    v.literal('used'),
  ),

  // Expiration
  expiresAt: v.optional(v.number()),

  // Metadata
  createdAt: v.number(),
  lastAccessedAt: v.optional(v.number()),
})
  .index('by_token', ['token'])
  .index('by_lead', ['leadId'])
  .index('by_status', ['status'])
  .index('by_company', ['companyId']);
