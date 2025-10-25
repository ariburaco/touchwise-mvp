import { v } from 'convex/values';
import { authedMutation, authedQuery } from '../helpers/queryHelpers';

// Default user settings configuration
const DEFAULT_SETTINGS = {
  // Appearance
  theme: 'system',
  language: 'en',
  
  // Display preferences
  dateFormat: 'MM/DD/YYYY',
  timezone: 'UTC',
  defaultView: 'grid',
  sidebarCollapsed: false,
  tablePageSize: 25,
  
  // Notifications
  emailNotifications: true,
} as const;

// Input validation schema for settings updates
const settingsUpdateSchema = v.object({
  theme: v.optional(v.string()),
  language: v.optional(v.string()),
  dateFormat: v.optional(v.string()),
  timezone: v.optional(v.string()),
  defaultView: v.optional(v.string()),
  sidebarCollapsed: v.optional(v.boolean()),
  tablePageSize: v.optional(v.number()),
  emailNotifications: v.optional(v.boolean()),
});

/**
 * Get current user's settings
 * Returns existing settings or default values if none exist
 */
export const get = authedQuery({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();
    
    if (!settings) {
      // Return defaults with metadata (without creating in DB)
      const now = Date.now();
      return {
        ...DEFAULT_SETTINGS,
        userId: ctx.userId,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
      };
    }
    
    return settings;
  },
});

/**
 * Update user settings
 * Creates settings if they don't exist
 */
export const update = authedMutation({
  args: settingsUpdateSchema,
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get existing or create new
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();
    
    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
        lastSyncedAt: now,
      });
      return await ctx.db.get(existing._id);
    }
    
    // Create new settings
    const settingsId = await ctx.db.insert('userSettings', {
      userId: ctx.userId,
      ...DEFAULT_SETTINGS,
      ...args,
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: now,
    });
    
    return await ctx.db.get(settingsId);
  },
});

/**
 * Reset settings to defaults
 */
export const reset = authedMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();
    
    if (existing) {
      // Reset existing settings
      await ctx.db.patch(existing._id, {
        ...DEFAULT_SETTINGS,
        updatedAt: now,
        lastSyncedAt: now,
      });
      return await ctx.db.get(existing._id);
    }
    
    // Create new settings with defaults
    const settingsId = await ctx.db.insert('userSettings', {
      userId: ctx.userId,
      ...DEFAULT_SETTINGS,
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: now,
    });
    
    return await ctx.db.get(settingsId);
  },
});

/**
 * Sync settings from client
 * Merges client settings based on timestamp comparison
 */
export const sync = authedMutation({
  args: {
    settings: settingsUpdateSchema,
    clientType: v.string(), // 'web' or 'mobile'
    clientTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .first();
    
    if (!existing) {
      // No server settings, create with client data
      const settingsId = await ctx.db.insert('userSettings', {
        userId: ctx.userId,
        ...DEFAULT_SETTINGS,
        ...args.settings,
        syncedFromClient: args.clientType,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
      });
      return await ctx.db.get(settingsId);
    }
    
    // Only update if client is newer
    if (args.clientTimestamp > existing.lastSyncedAt) {
      await ctx.db.patch(existing._id, {
        ...args.settings,
        syncedFromClient: args.clientType,
        updatedAt: now,
        lastSyncedAt: now,
      });
      return await ctx.db.get(existing._id);
    }
    
    // Server is newer, return existing
    return existing;
  },
});

// Export defaults for use in other modules
export { DEFAULT_SETTINGS };