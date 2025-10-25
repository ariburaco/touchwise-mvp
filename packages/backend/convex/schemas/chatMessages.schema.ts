import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const chatMessages = defineTable({
  // Relationship
  sessionId: v.id('chatSessions'),

  // Message content
  role: v.union(
    v.literal('user'),
    v.literal('assistant'),
    v.literal('system'),
  ),
  content: v.string(),

  // Audio/Voice
  hasAudio: v.optional(v.boolean()),
  audioStorageId: v.optional(v.id('_storage')),

  // Metadata
  createdAt: v.number(),
})
  .index('by_session', ['sessionId'])
  .index('by_session_created', ['sessionId', 'createdAt']);
