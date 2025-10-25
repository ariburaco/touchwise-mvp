import { v } from 'convex/values';
import {
  query,
  internalMutation,
  internalAction,
  internalQuery,
} from './_generated/server';
import { internal } from './_generated/api';
import { Doc } from './_generated/dataModel';

// Type for subscription with lifetime flag
type SubscriptionWithLifetime =
  | (Doc<'subscriptions'> & { isLifetime: false })
  | {
      _id: string;
      _creationTime: number;
      userId: Doc<'subscriptions'>['userId'];
      polarCustomerId: string;
      polarSubscriptionId: string;
      productId: string;
      productName: string;
      status: 'active';
      currentPeriodStart: number;
      currentPeriodEnd: number;
      cancelAtPeriodEnd: false;
      createdAt: number;
      updatedAt: number;
      isLifetime: true;
    };

// Get user's active subscription
export const getActiveSubscription = query({
  args: {},
  handler: async (ctx): Promise<SubscriptionWithLifetime | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return null;
    }

    // Check if user has lifetime access
    if (user.hasLifetimeAccess) {
      // Return a virtual subscription object for lifetime users
      return {
        _id: 'lifetime',
        _creationTime: user.lifetimePurchaseDate || Date.now(),
        userId: user._id,
        polarCustomerId: user.polarCustomerId || '',
        polarSubscriptionId: 'lifetime',
        productId: process.env.POLAR_PRODUCT_ID_LIFETIME || 'lifetime',
        productName: 'Lifetime Pro',
        status: 'active' as const,
        currentPeriodStart: user.lifetimePurchaseDate || Date.now(),
        currentPeriodEnd: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000, // 100 years from now
        cancelAtPeriodEnd: false,
        createdAt: user.lifetimePurchaseDate || Date.now(),
        updatedAt: Date.now(),
        isLifetime: true,
      };
    }

    // Get active subscription - order by creation date DESC to get the most recent
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'trialing')
        )
      )
      .order('desc')
      .first();

    // Add isLifetime: false to regular subscriptions
    if (subscription) {
      return { ...subscription, isLifetime: false };
    }

    return null;
  },
});

export const getActiveSubscriptionInternal = internalQuery({
  args: {
    betterAuthUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by email
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('betterAuthUserId'), args.betterAuthUserId))
      .first();

    if (!user) {
      return null;
    }

    // Check if user has lifetime access
    if (user.hasLifetimeAccess) {
      // Return a virtual subscription object for lifetime users
      const subscription = {
        _id: 'lifetime',
        _creationTime: user.lifetimePurchaseDate || Date.now(),
        userId: user._id,
        polarCustomerId: user.polarCustomerId || '',
        polarSubscriptionId: 'lifetime',
        productId: process.env.POLAR_PRODUCT_ID_LIFETIME || 'lifetime',
        productName: 'Lifetime Pro',
        status: 'active' as const,
        currentPeriodStart: user.lifetimePurchaseDate || Date.now(),
        currentPeriodEnd: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000, // 100 years from now
        cancelAtPeriodEnd: false,
        createdAt: user.lifetimePurchaseDate || Date.now(),
        updatedAt: Date.now(),
        isLifetime: true,
      };
      return { subscription, user };
    }

    // Get active subscription - order by creation date DESC to get the most recent
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'active'),
          q.eq(q.field('status'), 'trialing')
        )
      )
      .order('desc')
      .first();

    // Add isLifetime: false to regular subscriptions
    if (subscription) {
      return {
        subscription: { ...subscription, isLifetime: false },
        user,
      };
    }

    return null;
  },
});

// List all user subscriptions
export const listSubscriptions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const limit = args.limit || 10;
    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return subscriptions;
  },
});

// Debug: Get all active subscriptions for current user
export const debugGetAllActiveSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { subscriptions: [], message: 'No identity' };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return { subscriptions: [], message: 'User not found' };
    }

    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .order('desc')
      .collect();

    return {
      subscriptions,
      message: `Found ${subscriptions.length} active subscriptions`,
      latestSubscription: subscriptions[0] || null,
    };
  },
});

// List user orders
export const listOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const limit = args.limit || 10;
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return orders;
  },
});

// Get usage meters
export const getUsageMeters = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user by email
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const meters = await ctx.db
      .query('usageMeters')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return meters;
  },
});

// Internal: Sync customer state from Polar
export const syncCustomerState = internalAction({
  args: {
    polarCustomerId: v.string(),
    event: v.string(),
    externalId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(
      '📊 Polar customer state changed:',
      args.event,
      args.polarCustomerId
    );

    // Find user by Polar customer ID
    let user = await ctx.runQuery(
      internal.subscriptions.getUserByPolarCustomerId,
      {
        polarCustomerId: args.polarCustomerId,
      }
    );

    if (!user) {
      // Try to find and link user using external ID or email
      const linkedUser = await ctx.runAction(
        internal.subscriptions.findAndLinkUser,
        {
          polarCustomerId: args.polarCustomerId,
          betterAuthUserId: args.externalId || args.polarCustomerId,
          email: args.email,
        }
      );
      user = linkedUser;
    }

    if (!user) {
      console.error('User not found for Polar customer:', args.polarCustomerId);
      return;
    }

    // Only log activity, no user notification for internal state changes
    // User notifications are handled by specific events (order paid, subscription created, etc.)
    await ctx.runMutation(internal.activityLogs.logActivity, {
      userId: user._id as any,
      action: 'polar.customer_state_changed',
      description: `Customer state: ${args.event}`,
      metadata: {
        polarCustomerId: args.polarCustomerId,
        event: args.event,
      },
    });
  },
});

// Internal: Handle order paid event
export const handleOrderPaid = internalAction({
  args: {
    orderId: v.string(),
    customerId: v.string(),
    externalId: v.optional(v.string()),
    email: v.optional(v.string()),
    // Add order details
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find user by Polar customer ID
    let user = await ctx.runQuery(
      internal.subscriptions.getUserByPolarCustomerId,
      {
        polarCustomerId: args.customerId,
      }
    );

    if (!user) {
      // Try to find and link user
      const linkedUser = await ctx.runAction(
        internal.subscriptions.findAndLinkUser,
        {
          polarCustomerId: args.customerId,
          betterAuthUserId: args.externalId || args.customerId,
          email: args.email,
        }
      );
      user = linkedUser;
    }

    if (!user) {
      console.error('User not found for Polar customer:', args.customerId);
      return;
    }

    // Log webhook event
    console.log('💰 Polar webhook: order.paid', args.orderId);

    // Create/update order record
    await ctx.runMutation(internal.subscriptions.upsertOrder, {
      userId: user._id as any,
      polarCustomerId: args.customerId,
      polarOrderId: args.orderId,
      status: 'completed',
      amount: args.amount,
      currency: args.currency,
      productId: args.productId,
      productName: args.productName,
    });

    // Check if this is a lifetime product
    const isLifetimeProduct =
      args.productId === process.env.POLAR_PRODUCT_ID_LIFETIME;

    if (isLifetimeProduct) {
      // Grant lifetime access
      await ctx.runMutation(internal.subscriptions.grantLifetimeAccess, {
        userId: user._id as any,
      });

      // Send lifetime purchase notification
      await ctx.runMutation(internal.notifications.createForUser, {
        userId: user._id as any,
        title: '🎉 Lifetime Access Activated!',
        message:
          'Congratulations! You now have lifetime access to all Pro features.',
        type: 'success',
        actionUrl: '/dashboard/billing',
        actionText: 'View Details',
      });
    } else {
      // Send regular payment notification
      await ctx.runMutation(internal.notifications.createForUser, {
        userId: user._id as any,
        title: '✅ Payment Successful',
        message: 'Your subscription payment has been processed successfully.',
        type: 'success',
        actionUrl: '/dashboard/billing',
        actionText: 'View Receipt',
      });
    }

    // Send email
    await ctx.runAction(internal.emails.sendNotificationEmail, {
      userEmail: (user as any).email,
      userName: (user as any).name,
      notificationTitle: 'Payment Confirmation',
      notificationMessage:
        'Your payment has been successfully processed. Thank you for your subscription!',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      actionText: 'View Billing Details',
    });
  },
});

// Internal: Handle subscription events
export const handleSubscriptionEvent = internalAction({
  args: {
    subscriptionId: v.string(),
    customerId: v.string(),
    event: v.string(),
    externalId: v.optional(v.string()),
    email: v.optional(v.string()),
    // Additional subscription data
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
    status: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    currentPeriodEnd: v.optional(v.number()),
    currentPeriodStart: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find user by Polar customer ID
    let user = await ctx.runQuery(
      internal.subscriptions.getUserByPolarCustomerId,
      {
        polarCustomerId: args.customerId,
      }
    );

    if (!user) {
      // Try to find and link user
      const linkedUser = await ctx.runAction(
        internal.subscriptions.findAndLinkUser,
        {
          polarCustomerId: args.customerId,
          betterAuthUserId: args.externalId || args.customerId,
          email: args.email,
        }
      );
      user = linkedUser;
    }

    if (!user) {
      console.error('User not found for Polar customer:', args.customerId);
      return;
    }

    // Log webhook event
    console.log(
      `📊 Polar webhook: subscription.${args.event}`,
      args.subscriptionId
    );

    // Update subscription record
    await ctx.runMutation(internal.subscriptions.upsertSubscription, {
      userId: user._id as any,
      polarCustomerId: args.customerId,
      polarSubscriptionId: args.subscriptionId,
      event: args.event,
      productId: args.productId,
      productName: args.productName,
      status: args.status,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      currentPeriodEnd: args.currentPeriodEnd,
      currentPeriodStart: args.currentPeriodStart,
    });

    // Update user's subscription tier
    // Only downgrade to 'free' if subscription is truly canceled (not just pending cancellation)
    // When cancelAtPeriodEnd is true, user keeps access until period ends
    let shouldUpdateTier = false;
    let newTier: 'free' | 'pro' | 'team' | 'enterprise' = 'pro';

    if (args.event === 'created') {
      shouldUpdateTier = true;
      newTier = 'pro'; // Default to pro, could be enhanced to detect actual tier
    } else if (args.event === 'canceled' && !args.cancelAtPeriodEnd) {
      // Immediate cancellation - downgrade now
      shouldUpdateTier = true;
      newTier = 'free';
    }
    // If cancelAtPeriodEnd is true, don't change tier - user keeps access

    if (shouldUpdateTier) {
      await ctx.runMutation(internal.subscriptions.updateUserTier, {
        userId: user._id as any,
        tier: newTier,
      });
    }

    // Send appropriate notification (skip 'updated' to avoid duplicates)
    const notificationMap = {
      created: {
        title: '🎉 Welcome to Pro!',
        message:
          'Your Pro subscription is now active. Enjoy all the premium features!',
        type: 'success' as const,
      },
      canceled: {
        title: '⚠️ Subscription Canceled',
        message:
          'Your subscription has been canceled and will end at the current billing period.',
        type: 'warning' as const,
      },
      // Skip 'updated' notifications as they're usually redundant with other events
    };

    const notification =
      notificationMap[args.event as keyof typeof notificationMap];
    if (notification) {
      await ctx.runMutation(internal.notifications.createForUser, {
        userId: user._id as any,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        actionUrl: '/dashboard/billing',
        actionText: 'View Details',
      });
    }
  },
});

// Internal queries
export const getUserByPolarCustomerId = internalQuery({
  args: {
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    // First try to find by polarCustomerId
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('polarCustomerId'), args.polarCustomerId))
      .first();

    if (user) {
      return user;
    }

    // If not found, the polarCustomerId might be the Better Auth user ID
    // Try to match by ID directly (Polar might use Better Auth ID as external_id)
    try {
      // Check if it's a valid Convex ID format
      if (args.polarCustomerId.includes('_')) {
        const userById = await ctx.db.get(args.polarCustomerId as any);
        if (userById) {
          return userById;
        }
      }
    } catch (e) {
      // Invalid ID format, continue to other methods
    }

    // We can't update users in a query, so just return null
    // The linkPolarCustomer mutation should be called separately when needed
    return null;
  },
});

export const upsertOrder = internalMutation({
  args: {
    userId: v.id('users'),
    polarCustomerId: v.string(),
    polarOrderId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('refunded')
    ),
    // Add optional order details
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('orders')
      .withIndex('by_polar_order', (q) =>
        q.eq('polarOrderId', args.polarOrderId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        amount: args.amount ?? existing.amount,
        currency: args.currency ?? existing.currency,
        productId: args.productId ?? existing.productId,
        productName: args.productName ?? existing.productName,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('orders', {
        userId: args.userId,
        polarCustomerId: args.polarCustomerId,
        polarOrderId: args.polarOrderId,
        productId: args.productId || '',
        productName: args.productName || '',
        amount: args.amount || 0,
        currency: args.currency || 'USD',
        billingType: 'recurring',
        status: args.status,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const upsertSubscription = internalMutation({
  args: {
    userId: v.id('users'),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    event: v.string(),
    // Additional fields from webhook
    productId: v.optional(v.string()),
    productName: v.optional(v.string()),
    status: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    currentPeriodEnd: v.optional(v.number()),
    currentPeriodStart: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_polar_subscription', (q) =>
        q.eq('polarSubscriptionId', args.polarSubscriptionId)
      )
      .first();

    const now = Date.now();

    // Determine the correct status
    // For cancellations, keep as 'active' if cancelAtPeriodEnd is true
    let status: string;
    if (args.event === 'canceled' && args.cancelAtPeriodEnd) {
      // Subscription is still active but will cancel at period end
      status = args.status || 'active';
    } else if (args.event === 'canceled') {
      // Immediate cancellation
      status = 'canceled';
    } else {
      // Use provided status or default to active
      status = args.status || 'active';
    }

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        status: status as any,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        canceledAt: args.event === 'canceled' ? now : existing.canceledAt,
        currentPeriodEnd: args.currentPeriodEnd || existing.currentPeriodEnd,
        currentPeriodStart:
          args.currentPeriodStart || existing.currentPeriodStart,
        productId: args.productId || existing.productId,
        productName: args.productName || existing.productName,
        updatedAt: now,
      });
    } else {
      // When creating a new subscription, mark other active subscriptions for the same product as replaced
      if (args.event === 'created' && status === 'active') {
        const otherActiveSubscriptions = await ctx.db
          .query('subscriptions')
          .withIndex('by_user', (q) => q.eq('userId', args.userId))
          .filter((q) =>
            q.and(
              q.eq(q.field('status'), 'active'),
              q.neq(q.field('polarSubscriptionId'), args.polarSubscriptionId)
            )
          )
          .collect();

        // Mark older subscriptions as replaced/inactive
        for (const oldSub of otherActiveSubscriptions) {
          if (oldSub.productId === args.productId || !oldSub.productId) {
            await ctx.db.patch(oldSub._id, {
              status: 'canceled' as any,
              canceledAt: now,
              updatedAt: now,
            });
          }
        }
      }

      await ctx.db.insert('subscriptions', {
        userId: args.userId,
        polarCustomerId: args.polarCustomerId,
        polarSubscriptionId: args.polarSubscriptionId,
        productId: args.productId || '',
        productName: args.productName || '',
        status: status as any,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        canceledAt: args.event === 'canceled' ? now : undefined,
        currentPeriodStart: args.currentPeriodStart || now,
        currentPeriodEnd:
          args.currentPeriodEnd || now + 30 * 24 * 60 * 60 * 1000,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateUserTier = internalMutation({
  args: {
    userId: v.id('users'),
    tier: v.union(
      v.literal('free'),
      v.literal('pro'),
      v.literal('team'),
      v.literal('enterprise')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      subscriptionTier: args.tier,
      updatedAt: Date.now(),
    });
  },
});

// Link Polar customer ID to user
export const linkPolarCustomer = internalMutation({
  args: {
    userId: v.id('users'),
    polarCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      polarCustomerId: args.polarCustomerId,
      updatedAt: Date.now(),
    });
  },
});

// Find and link user by Better Auth ID or email
export const findAndLinkUser = internalAction({
  args: {
    polarCustomerId: v.string(),
    betterAuthUserId: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Try to find user by Better Auth ID
    if (args.betterAuthUserId) {
      const user = await ctx.runQuery(
        internal.subscriptions.getUserByBetterAuthId,
        {
          betterAuthUserId: args.betterAuthUserId,
        }
      );
      if (user) {
        await ctx.runMutation(internal.subscriptions.linkPolarCustomer, {
          userId: user._id,
          polarCustomerId: args.polarCustomerId,
        });
        return user;
      }
    }

    // Try to find by email
    if (args.email) {
      const user = await ctx.runQuery(internal.subscriptions.getUserByEmail, {
        email: args.email,
      });
      if (user) {
        await ctx.runMutation(internal.subscriptions.linkPolarCustomer, {
          userId: user._id,
          polarCustomerId: args.polarCustomerId,
        });
        return user;
      }
    }

    return null;
  },
});

// Get user by ID
export const getUserById = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by email
export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

// Get user by Better Auth user ID
export const getUserByBetterAuthId = internalQuery({
  args: {
    betterAuthUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('betterAuthUserId'), args.betterAuthUserId))
      .first();
  },
});

// Grant lifetime access to a user
export const grantLifetimeAccess = internalMutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      hasLifetimeAccess: true,
      lifetimePurchaseDate: Date.now(),
      subscriptionTier: 'lifetime',
      updatedAt: Date.now(),
    });
  },
});

// Check if user has lifetime access
export const hasLifetimeAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    return user?.hasLifetimeAccess || false;
  },
});
