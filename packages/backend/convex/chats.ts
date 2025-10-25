import { v } from 'convex/values';
import { authedMutation, authedQuery } from './helpers/queryHelpers';
import { mutation, query } from './_generated/server';
import { ConvexError } from 'convex/values';

/**
 * Create a new chat session (when link is opened)
 * Public access for external users
 */
export const createSession = mutation({
  args: {
    chatLinkToken: v.string(),
    visitorName: v.optional(v.string()),
    visitorEmail: v.optional(v.string()),
  },
  handler: async (ctx, { chatLinkToken, visitorName, visitorEmail }) => {
    const link = await ctx.db
      .query('chatLinks')
      .withIndex('by_token', (q) => q.eq('token', chatLinkToken))
      .first();

    if (!link) {
      throw new ConvexError('Chat link not found');
    }

    if (link.status === 'expired') {
      throw new ConvexError('This chat link has expired');
    }

    if (link.expiresAt && link.expiresAt < Date.now()) {
      await ctx.db.patch(link._id, { status: 'expired' });
      throw new ConvexError('This chat link has expired');
    }

    const sessionId = await ctx.db.insert('chatSessions', {
      chatLinkId: link._id,
      leadId: link.leadId,
      companyId: link.companyId,
      status: 'active',
      visitorName,
      visitorEmail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(link._id, {
      status: 'used',
      lastAccessedAt: Date.now(),
    });

    return await ctx.db.get(sessionId);
  },
});

/**
 * Get session with context (company, lead data)
 */
export const getSession = query({
  args: {
    sessionId: v.id('chatSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new ConvexError('Session not found');
    }

    const company = await ctx.db.get(session.companyId);
    const lead = await ctx.db.get(session.leadId);

    return {
      ...session,
      company,
      lead,
    };
  },
});

/**
 * Add a message to chat session
 * Public access for external users
 */
export const addMessage = mutation({
  args: {
    sessionId: v.id('chatSessions'),
    role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
    content: v.string(),
    audioStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, { sessionId, role, content, audioStorageId }) => {
    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new ConvexError('Session not found');
    }

    if (session.status !== 'active') {
      throw new ConvexError('This chat session is no longer active');
    }

    const messageId = await ctx.db.insert('chatMessages', {
      sessionId,
      role,
      content,
      hasAudio: !!audioStorageId,
      audioStorageId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(sessionId, {
      updatedAt: Date.now(),
    });

    return await ctx.db.get(messageId);
  },
});

/**
 * Get messages for a session
 * Public access for external users
 */
export const getMessages = query({
  args: {
    sessionId: v.id('chatSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new ConvexError('Session not found');
    }

    const messages = await ctx.db
      .query('chatMessages')
      .withIndex('by_session_created', (q) => q.eq('sessionId', sessionId))
      .order('asc')
      .collect();

    return messages;
  },
});

/**
 * List sessions for a lead (authenticated)
 */
export const listSessionsByLead = authedQuery({
  args: {
    leadId: v.id('leads'),
  },
  handler: async (ctx, { leadId }) => {
    const lead = await ctx.db.get(leadId);

    if (!lead) {
      throw new ConvexError('Lead not found');
    }

    const company = await ctx.db.get(lead.companyId);

    if (!company || company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to view sessions for this lead');
    }

    const sessions = await ctx.db
      .query('chatSessions')
      .withIndex('by_lead', (q) => q.eq('leadId', leadId))
      .order('desc')
      .collect();

    return sessions;
  },
});

/**
 * List all sessions for user's companies
 */
export const listSessions = authedQuery({
  args: {
    status: v.optional(
      v.union(
        v.literal('active'),
        v.literal('completed'),
        v.literal('abandoned')
      )
    ),
  },
  handler: async (ctx, { status }) => {
    const companies = await ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect();

    const companyIds = companies.map((c) => c._id);

    const allSessions = await ctx.db.query('chatSessions').collect();
    const userSessions = allSessions.filter((session) =>
      companyIds.includes(session.companyId)
    );

    if (status) {
      return userSessions.filter((session) => session.status === status);
    }

    return userSessions;
  },
});

/**
 * Update session status
 */
export const updateSessionStatus = authedMutation({
  args: {
    sessionId: v.id('chatSessions'),
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('abandoned')
    ),
  },
  handler: async (ctx, { sessionId, status }) => {
    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new ConvexError('Session not found');
    }

    const company = await ctx.db.get(session.companyId);

    if (!company || company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to update this session');
    }

    const updateData = {
      status,
      updatedAt: Date.now(),
    } as Record<string, string | number>;

    if (status === 'completed' || status === 'abandoned') {
      updateData.endedAt = Date.now();
    }

    await ctx.db.patch(sessionId, updateData);

    return await ctx.db.get(sessionId);
  },
});

/**
 * End session (public access)
 */
export const endSession = mutation({
  args: {
    sessionId: v.id('chatSessions'),
  },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);

    if (!session) {
      throw new ConvexError('Session not found');
    }

    await ctx.db.patch(sessionId, {
      status: 'completed',
      updatedAt: Date.now(),
      endedAt: Date.now(),
    });

    return { success: true };
  },
});
