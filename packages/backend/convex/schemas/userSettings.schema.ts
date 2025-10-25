import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const userSettings = defineTable({
  userId: v.id('users'),
  
  // Appearance settings
  theme: v.string(), // 'light', 'dark', 'system'
  language: v.string(), // 'en', 'tr', etc.
  
  // Display preferences
  dateFormat: v.optional(v.string()), // 'MM/DD/YYYY', 'DD/MM/YYYY', etc.
  timezone: v.optional(v.string()), // User timezone
  defaultView: v.optional(v.string()), // 'grid', 'table', 'list'
  sidebarCollapsed: v.optional(v.boolean()),
  tablePageSize: v.optional(v.number()),
  
  // Notification preferences
  emailNotifications: v.optional(v.boolean()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  lastSyncedAt: v.number(),
  syncedFromClient: v.optional(v.string()), // 'web', 'mobile'
}).index('by_user', ['userId']);
