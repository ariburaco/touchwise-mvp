import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const companies = defineTable({
  // Basic fields
  name: v.string(),
  description: v.optional(v.string()),
  details: v.optional(
    v.object({
      industry: v.optional(v.string()),
      url: v.optional(v.string()),
    })
  ),
  // Ownership
  userId: v.id('users'),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_created', ['createdAt']);
