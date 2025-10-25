import { v } from 'convex/values';
import { query } from '../_generated/server';
import { authedMutation, authedQuery } from '../helpers/queryHelpers';
import { betterAuthComponent, createAuth } from '../auth';

/**
 * Get current user's profile
 */
export const get = authedQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(ctx.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user settings
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();

    return {
      ...user,
      settings,
    };
  },
});

/**
 * Update user profile
 */
export const update = authedMutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {

    try {
      // Update user profile
      await ctx.db.patch(ctx.userId, {
        ...args,
      });

      const auth = createAuth(ctx);
      const headers = await betterAuthComponent.getHeaders(ctx);

      await auth.api.updateUser({
        body: {
          name: args.name,
          image: args.avatar,
        },
        headers,
      });

      return await ctx.db.get(ctx.userId);
    } catch (error) {
      console.error(error);
      throw new Error('Failed to update profile');
    }
  },
});

/**
 * Upload profile avatar
 */
export const uploadAvatar = authedMutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { storageId }) => {
    // Get the URL for the uploaded file
    const url = await ctx.storage.getUrl(storageId);

    if (!url) {
      throw new Error('Failed to get storage URL');
    }

    // Update user profile with avatar URL
    await ctx.db.patch(ctx.userId, {
      avatar: url,
    });

    const auth = createAuth(ctx);
    const headers = await betterAuthComponent.getHeaders(ctx);

    await auth.api.updateUser({
      body: {
        image: url,
      },
      headers,
    });

    return { url };
  },
});

/**
 * Delete user account (soft delete)
 */
export const deleteAccount = authedMutation({
  args: {
    confirmation: v.string(), // User must type "DELETE" to confirm
  },
  handler: async (ctx, { confirmation }) => {
    if (confirmation !== 'DELETE') {
      throw new Error('Invalid confirmation');
    }

    // Soft delete by marking account as deleted
    await ctx.db.patch(ctx.userId, {
      deletedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get user by ID (public profile)
 */
export const getById = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Return only public information
    return {
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      createdAt: user._creationTime,
    };
  },
});

/**
 * Search users
 */
export const search = authedQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit = 10 }) => {
    // Simple search implementation
    // In production, you might want to use a proper search index
    const users = await ctx.db.query('users').collect();

    const filtered = users
      .filter(
        (user) =>
          user.name?.toLowerCase().includes(query.toLowerCase()) ||
          user.email?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);

    return filtered.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    }));
  },
});
