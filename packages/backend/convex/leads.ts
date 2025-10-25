import { v } from 'convex/values';
import { authedMutation, authedQuery } from './helpers/queryHelpers';
import { ConvexError } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, internalQuery } from './_generated/server';

/**
 * Create a new lead
 */
export const create = authedMutation({
  args: {
    companyId: v.id('companies'),
    url: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);

    if (!company) {
      throw new ConvexError('Company not found');
    }

    if (company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to add leads to this company');
    }

    const leadId = await ctx.db.insert('leads', {
      companyId: args.companyId,
      url: args.url,
      title: args.title,
      description: args.description,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.scrapeCompany.scrapeAndUpdateLead, {
      leadId,
    });

    return await ctx.db.get(leadId);
  },
});

/**
 * Get lead by ID with company data
 */
export const get = authedQuery({
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
      throw new ConvexError('Not authorized to view this lead');
    }

    return {
      ...lead,
      company,
    };
  },
});

/**
 * List leads
 * Can filter by company or get all for user
 */
export const list = authedQuery({
  args: {
    companyId: v.optional(v.id('companies')),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed')
      )
    ),
  },
  handler: async (ctx, { companyId, status }) => {
    if (companyId) {
      const company = await ctx.db.get(companyId);

      if (!company || company.userId !== ctx.userId) {
        throw new ConvexError('Not authorized to view this company');
      }

      let query = ctx.db
        .query('leads')
        .withIndex('by_company', (q) => q.eq('companyId', companyId));

      if (status) {
        const allLeads = await query.collect();
        return allLeads.filter((lead) => lead.status === status);
      }

      return await query.order('desc').collect();
    }

    const companies = await ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect();

    const companyIds = companies.map((c) => c._id);

    const allLeads = await ctx.db.query('leads').collect();
    const userLeads = allLeads.filter((lead) =>
      companyIds.includes(lead.companyId)
    );

    if (status) {
      return userLeads.filter((lead) => lead.status === status);
    }

    return userLeads;
  },
});

/**
 * Update lead
 */
export const update = authedMutation({
  args: {
    leadId: v.id('leads'),
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed')
      )
    ),
    knowledgeBase: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, ...updates }) => {
    const lead = await ctx.db.get(leadId);

    if (!lead) {
      throw new ConvexError('Lead not found');
    }

    const company = await ctx.db.get(lead.companyId);

    if (!company || company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to update this lead');
    }

    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    } as Record<string, string | number | undefined>;

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.processedAt = Date.now();
    }

    await ctx.db.patch(leadId, updateData);

    return await ctx.db.get(leadId);
  },
});

/**
 * Delete lead
 */
export const remove = authedMutation({
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
      throw new ConvexError('Not authorized to delete this lead');
    }

    await ctx.db.delete(leadId);

    return { success: true };
  },
});

/**
 * Internal query to get lead (for actions)
 */
export const getInternal = internalQuery({
  args: {
    leadId: v.id('leads'),
  },
  handler: async (ctx, { leadId }) => {
    return await ctx.db.get(leadId);
  },
});

/**
 * Internal mutation to update lead (for actions)
 */
export const updateInternal = internalMutation({
  args: {
    leadId: v.id('leads'),
    url: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed')
      )
    ),
    knowledgeBase: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { leadId, ...updates }) => {
    const updateData = {
      ...updates,
      updatedAt: Date.now(),
    } as Record<string, string | number | undefined>;

    if (updates.status === 'completed' || updates.status === 'failed') {
      updateData.processedAt = Date.now();
    }

    await ctx.db.patch(leadId, updateData);

    return await ctx.db.get(leadId);
  },
});
