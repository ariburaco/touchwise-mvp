import { v } from 'convex/values';
import { authedMutation, authedQuery } from './helpers/queryHelpers';
import { internalQuery, internalMutation, query } from './_generated/server';

// Generate upload URL for image uploads
export const generateUploadUrl = authedMutation(async (ctx) => {
  // Generate a short-lived upload URL
  return await ctx.storage.generateUploadUrl();
});

// Get image URL by storage ID
export const getImageUrl = authedQuery({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

// Get public image URL by storage ID (accessible without authentication)
// Note: Convex storage URLs are already publicly accessible signed URLs
export const getPublicImageUrl = query({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    // Return the direct Convex storage URL - these are publicly accessible
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

// Delete image from storage
export const deleteImage = authedMutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    try {
      await ctx.storage.delete(args.storageId);
    } catch (error) {
      // Log the error but don't fail - the image might already be deleted
      console.warn(`Failed to delete storage ${args.storageId}:`, error);
    }
  },
});

// Store image metadata (called after successful upload)
export const storeImage = authedMutation({
  args: {
    storageId: v.id('_storage'),
    metadata: v.optional(
      v.object({
        fileName: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        mimeType: v.optional(v.string()),
      })
    ),
  },
  handler: async (_ctx, args) => {
    // You can store additional metadata in a separate table if needed
    // For now, we'll just return the storage ID
    return args.storageId;
  },
});

// Internal query to get image URL by storage ID (used by system actions)
export const getImageUrlInternal = internalQuery({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

// Internal mutation to delete image from storage (used by system actions)
export const deleteImageInternal = internalMutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, args) => {
    try {
      await ctx.storage.delete(args.storageId);
    } catch (error) {
      // Log the error but don't fail - the image might already be deleted
      console.warn(`Failed to delete storage ${args.storageId}:`, error);
    }
  },
});
