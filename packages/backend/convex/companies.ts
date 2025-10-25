import { v } from 'convex/values';
import { authedMutation, authedQuery } from './helpers/queryHelpers';
import { ConvexError } from 'convex/values';

/**
 * Get or create user's default company
 * Called on first login to ensure user has a company
 */
export const getOrCreateDefault = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();

    if (existing) {
      return existing;
    }

    const companyId = await ctx.db.insert('companies', {
      name: `${ctx.user.name}'s Company`,
      userId: ctx.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(companyId);
  },
});

/**
 * Get user's default company (first one)
 */
export const getDefault = authedQuery({
  args: {},
  handler: async (ctx) => {
    const company = await ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();

    if (!company) {
      throw new ConvexError('No company found. Please create one first.');
    }

    return company;
  },
});

/**
 * Create a new company
 */
export const create = authedMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = await ctx.db.insert('companies', {
      name: args.name,
      description: args.description,
      userId: ctx.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(companyId);
  },
});

/**
 * Get company by ID
 */
export const get = authedQuery({
  args: {
    companyId: v.id('companies'),
  },
  handler: async (ctx, { companyId }) => {
    const company = await ctx.db.get(companyId);

    if (!company) {
      throw new ConvexError('Company not found');
    }

    if (company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to view this company');
    }

    return company;
  },
});

/**
 * List all companies for current user
 */
export const list = authedQuery({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db
      .query('companies')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .order('desc')
      .collect();

    return companies;
  },
});

/**
 * Update company
 */
export const update = authedMutation({
  args: {
    companyId: v.id('companies'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    details: v.optional(
      v.object({
        industry: v.optional(v.string()),
        url: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { companyId, ...updates }) => {
    console.log('[Company Update] Received updates:', updates);

    const company = await ctx.db.get(companyId);

    if (!company) {
      throw new ConvexError('Company not found');
    }

    if (company.userId !== ctx.userId) {
      throw new ConvexError('Not authorized to update this company');
    }

    console.log('[Company Update] Current company:', company);

    await ctx.db.patch(companyId, {
      ...updates,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(companyId);
    console.log('[Company Update] Updated company:', updated);

    return updated;
  },
});
