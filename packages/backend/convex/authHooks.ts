import { internalAction, internalQuery, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

/**
 * Helper query to get user by email
 */
export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), args.email))
      .first();
  },
});

/**
 * Auth hook actions to be called from Better Auth database hooks
 * These run as Convex actions so they can send emails and perform other side effects
 */

export const onUserCreated = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    betterAuthUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First, find the user by email to get the Convex ID
    const user = await ctx.runQuery(internal.authHooks.getUserByEmail, {
      email: args.email,
    });
    
    if (!user) {
      console.error('User not found by email:', args.email);
      return;
    }
    
    // Store the Better Auth user ID if provided and not already set
    if (args.betterAuthUserId && !user.betterAuthUserId) {
      await ctx.runMutation(internal.authHooks.updateUserBetterAuthId, {
        userId: user._id,
        betterAuthUserId: args.betterAuthUserId,
      });
    }
    
    // Send welcome email
    await ctx.runAction(internal.emails.sendWelcomeEmail, {
      userEmail: args.email,
      userName: args.name,
    });
    
    // Create welcome notification with slight delay to avoid duplicate notifications
    // when user signs up and immediately subscribes
    await ctx.runMutation(internal.notifications.createForUser, {
      userId: user._id,
      title: '👋 Welcome!',
      message: 'Your account has been created. Explore the dashboard to get started.',
      type: 'success',
      actionUrl: '/dashboard',
      actionText: 'Go to Dashboard',
    });
    
    // Log signup activity
    await ctx.runMutation(internal.activityLogs.logActivity, {
      userId: user._id,
      action: 'user.signup',
      description: `New user signed up: ${args.email}`,
      metadata: {
        email: args.email,
        name: args.name,
        provider: 'email',
      },
    });
  },
});

export const onUserUpdated = internalAction({
  args: {
    email: v.string(),
    updatedFields: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the user by email to get the Convex ID
    const user = await ctx.runQuery(internal.authHooks.getUserByEmail, {
      email: args.email,
    });
    
    if (!user) {
      console.error('User not found by email:', args.email);
      return;
    }
    
    // Log profile update activity
    await ctx.runMutation(internal.activityLogs.logActivity, {
      userId: user._id,
      action: 'user.update_profile',
      description: 'User updated their profile',
      metadata: {
        updatedFields: args.updatedFields,
      },
    });
  },
});

export const onUserDeleted = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by email to get the Convex ID
    const user = await ctx.runQuery(internal.authHooks.getUserByEmail, {
      email: args.email,
    });
    
    if (!user) {
      console.error('User not found by email:', args.email);
      return;
    }
    
    // Log account deletion activity
    await ctx.runMutation(internal.activityLogs.logActivity, {
      userId: user._id,
      action: 'user.delete_account',
      description: `User account deleted: ${args.email}`,
      metadata: {
        email: args.email,
        deletedAt: Date.now(),
      },
    });
  },
});

export const onSessionCreated = internalAction({
  args: {
    betterAuthUserId: v.string(), // Better Auth user ID
    sessionId: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find the user by Better Auth ID
    let user = await ctx.runQuery(internal.subscriptions.getUserByBetterAuthId, {
      betterAuthUserId: args.betterAuthUserId,
    });

    // If not found by Better Auth ID, it might be the Convex user ID
    if (!user) {
      try {
        user = await ctx.runQuery(internal.subscriptions.getUserById, {
          userId: args.betterAuthUserId as any,
        });

        // If found, update the Better Auth ID for future lookups
        if (user && !user.betterAuthUserId) {
          await ctx.runMutation(internal.authHooks.updateUserBetterAuthId, {
            userId: user._id,
            betterAuthUserId: args.betterAuthUserId,
          });
        }
      } catch (e) {
        console.error('Could not find user for session:', args.betterAuthUserId);
        return;
      }
    }

    if (!user) {
      console.error('User not found for session:', args.betterAuthUserId);
      return;
    }

    // Update last seen
    await ctx.runMutation(internal.authHooks.updateUserLastSeen, {
      userId: user._id,
    });

    // Log activity
    await ctx.runMutation(internal.activityLogs.logActivity, {
      userId: user._id,
      action: 'user.login',
      description: 'User signed in',
      metadata: {
        sessionId: args.sessionId,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
      },
    });
  },
});

export const onSessionDeleted = internalAction({
  args: {
    betterAuthUserId: v.string(), // Better Auth user ID
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find the user
    let user = await ctx.runQuery(internal.subscriptions.getUserByBetterAuthId, {
      betterAuthUserId: args.betterAuthUserId,
    });

    if (!user) {
      try {
        user = await ctx.runQuery(internal.subscriptions.getUserById, {
          userId: args.betterAuthUserId as any,
        });
      } catch (e) {
        console.log('Could not find user for session deletion:', args.betterAuthUserId);
        return;
      }
    }

    if (user) {
      // Log activity
      await ctx.runMutation(internal.activityLogs.logActivity, {
        userId: user._id,
        action: 'user.logout',
        description: 'User signed out',
        metadata: {
          sessionId: args.sessionId,
        },
      });
    }
  },
});

// Update user's Better Auth ID
export const updateUserBetterAuthId = internalMutation({
  args: {
    userId: v.id('users'),
    betterAuthUserId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      betterAuthUserId: args.betterAuthUserId,
      updatedAt: Date.now(),
    });
  },
});

// Update user's last seen time
export const updateUserLastSeen = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeenAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});