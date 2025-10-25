import { v } from 'convex/values';
import { authedMutation, authedQuery } from './helpers/queryHelpers';
import { query } from './_generated/server';
import { ConvexError } from 'convex/values';

/**
 * Generate a unique chat link for a lead
 */
export const generate = authedMutation({
  args: {
    leadId: v.id('leads'),
    expiresInDays: v.optional(v.number()), // Default: no expiration
  },
  handler: async (ctx, { leadId, expiresInDays }) => {
    const lead = await ctx.db.get(leadId);

    if (!lead) {
      throw new ConvexError('Lead not found');
    }

    const company = await ctx.db.get(lead.companyId);

    if (!company || company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to create link for this lead');
    }

    const token = crypto.randomUUID();

    const expiresAt = expiresInDays
      ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    const linkId = await ctx.db.insert('chatLinks', {
      leadId,
      companyId: lead.companyId,
      token,
      status: 'active',
      expiresAt,
      createdAt: Date.now(),
    });

    const link = await ctx.db.get(linkId);

    return {
      ...link,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${token}`,
    };
  },
});

/**
 * Get chat link by token (public access for external users)
 */
export const getByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const link = await ctx.db
      .query('chatLinks')
      .withIndex('by_token', (q) => q.eq('token', token))
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

    const lead = await ctx.db.get(link.leadId);
    const company = await ctx.db.get(link.companyId);

    return {
      ...link,
      lead,
      company,
    };
  },
});

/**
 * Get chat link by ID
 */
export const get = authedQuery({
  args: {
    linkId: v.id('chatLinks'),
  },
  handler: async (ctx, { linkId }) => {
    const link = await ctx.db.get(linkId);

    if (!link) {
      throw new ConvexError('Chat link not found');
    }

    const company = await ctx.db.get(link.companyId);

    if (!company || company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to view this link');
    }

    const lead = await ctx.db.get(link.leadId);

    return {
      ...link,
      lead,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${link.token}`,
    };
  },
});

/**
 * List chat links by lead
 */
export const listByLead = authedQuery({
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
      throw new ConvexError('Not authorized to view links for this lead');
    }

    const links = await ctx.db
      .query('chatLinks')
      .withIndex('by_lead', (q) => q.eq('leadId', leadId))
      .collect();

    return links.map((link) => ({
      ...link,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${link.token}`,
    }));
  },
});

/**
 * List all chat links for user's companies
 */
export const list = authedQuery({
  args: {
    status: v.optional(
      v.union(v.literal('active'), v.literal('expired'), v.literal('used'))
    ),
  },
  handler: async (ctx, { status }) => {
    const companies = await ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect();

    const companyIds = companies.map((c) => c._id);

    const allLinks = await ctx.db.query('chatLinks').collect();
    const userLinks = allLinks.filter((link) =>
      companyIds.includes(link.companyId)
    );

    const filtered = status
      ? userLinks.filter((link) => link.status === status)
      : userLinks;

    return filtered.map((link) => ({
      ...link,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat/${link.token}`,
    }));
  },
});

/**
 * Update chat link status
 */
export const updateStatus = authedMutation({
  args: {
    linkId: v.id('chatLinks'),
    status: v.union(
      v.literal('active'),
      v.literal('expired'),
      v.literal('used')
    ),
  },
  handler: async (ctx, { linkId, status }) => {
    const link = await ctx.db.get(linkId);

    if (!link) {
      throw new ConvexError('Chat link not found');
    }

    const company = await ctx.db.get(link.companyId);

    if (!company || company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to update this link');
    }

    await ctx.db.patch(linkId, { status });

    return await ctx.db.get(linkId);
  },
});

/**
 * Mark link as accessed (used by public chat page)
 */
export const markAccessed = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const link = await ctx.db
      .query('chatLinks')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first();

    if (!link) {
      throw new ConvexError('Chat link not found');
    }

    await ctx.db.patch(link._id, {
      lastAccessedAt: Date.now(),
    });

    return { success: true };
  },
});
