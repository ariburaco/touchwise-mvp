import { action, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { Polar } from '@polar-sh/sdk';
import { authedAction, authedMutation } from './helpers/queryHelpers';

// Initialize Polar client
const createPolarClient = () => {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    return null;
  }

  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'sandbox',
  });
};

// Create or sync Polar customer for existing user
export const createOrSyncCustomer = authedMutation({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    polarCustomerId: string;
    isNew?: boolean;
  }> => {
    // Get user from database
    const user = ctx.user;
    console.log('🚀 ~ user:', user);

    // Check if already has Polar customer ID
    if (user.polarCustomerId) {
      console.log('User already has Polar customer ID:', user.polarCustomerId);
      return { success: true, polarCustomerId: user.polarCustomerId };
    }

    const polarClient = createPolarClient();
    if (!polarClient) {
      throw new Error('Polar not configured');
    }

    try {
      // First, try to find existing customer by email
      const customers = await polarClient.customers.list({
        query: user.email!,
      });

      let polarCustomer;

      if (customers.result.items && customers.result.items.length > 0) {
        // Customer exists, use the first match
        polarCustomer = customers.result.items[0];
        console.log('Found existing Polar customer:', polarCustomer.id);
      } else {
        // Create new customer
        polarCustomer = await polarClient.customers.create({
          email: user.email!,
          name: user.name || undefined,
          // Don't set external_id on create to avoid conflicts
          metadata: {
            convexUserId: user._id,
            betterAuthId: user._id, // Better Auth user ID
            createdFrom: 'manual_sync',
          },
        });
        console.log('Created new Polar customer:', polarCustomer.id);
      }

      // Link Polar customer ID to user
      await ctx.runMutation(internal.subscriptions.linkPolarCustomer, {
        userId: user._id,
        polarCustomerId: polarCustomer.id,
      });

      return {
        success: true,
        polarCustomerId: polarCustomer.id,
        isNew: !customers.result.items || customers.result.items.length === 0,
      };
    } catch (error) {
      console.error('Error creating/syncing Polar customer:', error);
      throw new Error(`Failed to sync with Polar: ${error}`);
    }
  },
});

// Ensure all users have Polar customers (admin action)
export const ensureAllUsersHaveCustomers = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{ success: boolean; total: number; results: any[] }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get all users without Polar customer IDs
    const users: any[] = await ctx.runQuery(
      internal.polarCustomers.getUsersWithoutPolarIds,
      {}
    );

    const polarClient = createPolarClient();
    if (!polarClient) {
      throw new Error('Polar not configured');
    }

    const results: any[] = [];

    for (const user of users) {
      try {
        // Check if customer exists by email
        const customers = await polarClient.customers.list({
          query: user.email,
        });

        let polarCustomer;

        if (customers.result.items && customers.result.items.length > 0) {
          polarCustomer = customers.result.items[0];
          console.log(
            `Found existing customer for ${user.email}: ${polarCustomer.id}`
          );
        } else {
          // Create new customer
          polarCustomer = await polarClient.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
              convexUserId: user._id,
              createdFrom: 'bulk_sync',
            },
          });
          console.log(
            `Created new customer for ${user.email}: ${polarCustomer.id}`
          );
        }

        // Link to user
        await ctx.runMutation(internal.subscriptions.linkPolarCustomer, {
          userId: user._id,
          polarCustomerId: polarCustomer.id,
        });

        results.push({
          email: user.email,
          polarCustomerId: polarCustomer.id,
          isNew: !customers.result.items || customers.result.items.length === 0,
        });
      } catch (error) {
        console.error(`Error syncing customer for ${user.email}:`, error);
        results.push({
          email: user.email,
          error: String(error),
        });
      }
    }

    return {
      success: true,
      total: users.length,
      results,
    };
  },
});

// Internal query to get users without Polar IDs
export const getUsersWithoutPolarIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('polarCustomerId'), undefined))
      .collect();
    return users;
  },
});
