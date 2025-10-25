import './polyfills';
import {
  BetterAuth,
  convexAdapter,
  PublicAuthFunctions,
  type AuthFunctions,
} from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth, BetterAuthOptions } from 'better-auth';
import {
  customSession,
  twoFactor,
  magicLink,
  admin,
} from 'better-auth/plugins';
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { api, components, internal } from './_generated/api';
import type { DataModel, Doc, Id } from './_generated/dataModel';
import { ActionCtx, GenericCtx, query } from './_generated/server';

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

// Initialize the component
export const betterAuthComponent = new BetterAuth(components.betterAuth, {
  authFunctions,
  publicAuthFunctions,
});

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get user data from Better Auth - email, name, image, etc.
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    if (!userMetadata) {
      return null;
    }
    // Get user data from your application's database
    // (skip this if you have no fields in your users table schema)
    const user = await ctx.db.get(userMetadata.userId as Id<'users'>);
    return {
      ...user,
      ...userMetadata,
    };
  },
});

// Create auth functions for user hooks
export const {
  createUser,
  deleteUser,
  updateUser,
  createSession,
  isAuthenticated,
} = betterAuthComponent.createAuthFunctions<DataModel>({
  // Must create a user and return the user id
  onCreateUser: async (ctx, user) => {
    // The user parameter here is the Better Auth user object being created
    // We need to create our app's user and link it
    const userId = await ctx.db.insert('users', {
      name: user.name,
      email: user.email,
      avatar: user.image || undefined,
      phone: user.phoneNumber || undefined,
      // The ID from Better Auth will be returned as userId later
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return userId;
  },

  onUpdateUser: async (ctx, user) => {
    await ctx.db.patch(user.userId as Id<'users'>, {
      name: user.name,
      email: user.email,
      avatar: user.image || undefined,
      phone: user.phoneNumber || undefined,
    });
  },

  onCreateSession(ctx, session) {
    // console.log('onCreateSession', session);
  },

  // Delete the user when they are deleted from Better Auth
  onDeleteUser: async (ctx, userId) => {
    await ctx.db.delete(userId as Id<'users'>);
  },
});

const baseURL = process.env.CONVEX_SITE_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

// Initialize Polar client if credentials are provided
const createPolarClient = () => {
  // if (!process.env.POLAR_ACCESS_TOKEN) {
  //   console.warn(
  //     'POLAR_ACCESS_TOKEN not configured, Polar features will be disabled'
  //   );
  //   return null;
  // }

  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'sandbox',
  });
};

const polarClient = createPolarClient();

const createOptions = (ctx: GenericCtx) => {
  return {
    database: convexAdapter(ctx, betterAuthComponent),
    baseURL,
    appName: process.env.APP_NAME || 'Convex Template', // For 2FA issuer
    // Enhanced email/password configuration
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      sendResetPassword: async ({ user, url }) => {
        const actionCtx = ctx as ActionCtx;
        await actionCtx.scheduler?.runAfter(
          0,
          internal.emails.sendPasswordResetEmail,
          {
            userEmail: user.email,
            userName: user.name || undefined,
            resetUrl: url,
          }
        );
      },
    },
    // Social providers configuration
    socialProviders: {
      ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ? {
            github: {
              clientId: process.env.GITHUB_CLIENT_ID,
              clientSecret: process.env.GITHUB_CLIENT_SECRET,
            },
          }
        : {}),
    },
    // Account linking configuration
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github'],
      },
    },
    trustedOrigins: ['*'], // Allow all origins for development
    plugins: [
      convex(),
      magicLink({
        sendMagicLink: async ({ email, url, token }) => {
          const actionCtx = ctx as ActionCtx;
          await actionCtx.scheduler?.runAfter(
            0,
            internal.emails.sendMagicLinkEmail,
            {
              email,
              url,
              token,
            }
          );
        },
        expiresIn: 60 * 10, // 10 minutes
      }),
      // Add Polar plugin if configured
      polar({
        client: polarClient,
        createCustomerOnSignUp: true, // Enable auto-creation for new users
        use: [
          checkout({
            products: [
              // Define your products here - these should match your Polar dashboard
              {
                productId: process.env.POLAR_PRODUCT_ID_PRO || '',
                slug: 'pro',
              },
              {
                productId: process.env.POLAR_PRODUCT_ID_TEAM || '',
                slug: 'team',
              },
              {
                productId: process.env.POLAR_PRODUCT_ID_LIFETIME || '',
                slug: 'lifetime',
              },
            ],
            successUrl: `${NEXT_PUBLIC_APP_URL}/dashboard/billing/success?checkout_id={CHECKOUT_ID}`,
            authenticatedUsersOnly: true,
          }),
          portal(),
          usage(),
          ...(process.env.POLAR_WEBHOOK_SECRET
            ? [
                webhooks({
                  secret: process.env.POLAR_WEBHOOK_SECRET,
                  onCustomerStateChanged: async (payload) => {
                    console.log('Customer state changed:', payload);
                    const actionCtx = ctx as ActionCtx;
                    // Schedule action to sync subscription status
                    await actionCtx.scheduler?.runAfter(
                      0,
                      internal.subscriptions.syncCustomerState,
                      {
                        polarCustomerId: payload.data.id,
                        event: 'customer_state_changed',
                        externalId: payload.data.externalId || undefined,
                        email: payload.data.email || undefined,
                      }
                    );
                  },
                  onOrderPaid: async (payload) => {
                    console.log('Order paid:', payload);
                    const actionCtx = ctx as ActionCtx;
                    await actionCtx.scheduler?.runAfter(
                      0,
                      internal.subscriptions.handleOrderPaid,
                      {
                        orderId: payload.data.id,
                        customerId:
                          payload.data.customerId ||
                          payload.data.customer?.id ||
                          '',
                        externalId:
                          payload.data.customer?.externalId || undefined,
                        email: payload.data.customer?.email || undefined,
                        // Pass order details
                        amount: payload.data.totalAmount || undefined,
                        currency: payload.data.currency || 'USD',
                        productId: payload.data.productId || undefined,
                        productName: payload.data.product?.name || undefined,
                      }
                    );
                  },
                  onSubscriptionCreated: async (payload) => {
                    console.log('Subscription created:', payload);
                    const actionCtx = ctx as ActionCtx;
                    await actionCtx.scheduler?.runAfter(
                      0,
                      internal.subscriptions.handleSubscriptionEvent,
                      {
                        subscriptionId: payload.data.id,
                        customerId:
                          payload.data.customerId ||
                          payload.data.customer?.id ||
                          '',
                        event: 'created',
                        externalId:
                          payload.data.customer?.externalId || undefined,
                        email: payload.data.customer?.email || undefined,
                        // Pass complete subscription data
                        productId: payload.data.productId || undefined,
                        productName: payload.data.product?.name || undefined,
                        status: payload.data.status || 'active',
                        cancelAtPeriodEnd:
                          payload.data.cancelAtPeriodEnd || false,
                        currentPeriodEnd: payload.data.currentPeriodEnd
                          ? new Date(payload.data.currentPeriodEnd).getTime()
                          : undefined,
                        currentPeriodStart: payload.data.currentPeriodStart
                          ? new Date(payload.data.currentPeriodStart).getTime()
                          : undefined,
                      }
                    );
                  },
                  onSubscriptionUpdated: async (payload) => {
                    console.log('Subscription updated:', payload);
                    const actionCtx = ctx as ActionCtx;
                    await actionCtx.scheduler?.runAfter(
                      0,
                      internal.subscriptions.handleSubscriptionEvent,
                      {
                        subscriptionId: payload.data.id,
                        customerId:
                          payload.data.customerId ||
                          payload.data.customer?.id ||
                          '',
                        event: 'updated',
                        externalId:
                          payload.data.customer?.externalId || undefined,
                        email: payload.data.customer?.email || undefined,
                        // Pass complete subscription data
                        productId: payload.data.productId || undefined,
                        productName: payload.data.product?.name || undefined,
                        status: payload.data.status || 'active',
                        cancelAtPeriodEnd:
                          payload.data.cancelAtPeriodEnd || false,
                        currentPeriodEnd: payload.data.currentPeriodEnd
                          ? new Date(payload.data.currentPeriodEnd).getTime()
                          : undefined,
                        currentPeriodStart: payload.data.currentPeriodStart
                          ? new Date(payload.data.currentPeriodStart).getTime()
                          : undefined,
                      }
                    );
                  },
                  onSubscriptionCanceled: async (payload) => {
                    console.log('Subscription canceled:', payload);
                    const actionCtx = ctx as ActionCtx;
                    await actionCtx.scheduler?.runAfter(
                      0,
                      internal.subscriptions.handleSubscriptionEvent,
                      {
                        subscriptionId: payload.data.id,
                        customerId:
                          payload.data.customerId ||
                          payload.data.customer?.id ||
                          '',
                        event: 'canceled',
                        externalId:
                          payload.data.customer?.externalId || undefined,
                        email: payload.data.customer?.email || undefined,
                        // Pass complete subscription data - important for cancelAtPeriodEnd
                        productId: payload.data.productId || undefined,
                        productName: payload.data.product?.name || undefined,
                        status: payload.data.status || 'active',
                        cancelAtPeriodEnd:
                          payload.data.cancelAtPeriodEnd || false,
                        currentPeriodEnd: payload.data.currentPeriodEnd
                          ? new Date(payload.data.currentPeriodEnd).getTime()
                          : undefined,
                        currentPeriodStart: payload.data.currentPeriodStart
                          ? new Date(payload.data.currentPeriodStart).getTime()
                          : undefined,
                      }
                    );
                  },
                  onPayload: async (payload) => {
                    // Catch-all for all events
                    console.log('Polar webhook event:', payload.type);
                  },
                }),
              ]
            : []),
        ],
      }),
      twoFactor({
        issuer: process.env.APP_NAME || 'Convex Template',
        otpOptions: {
          async sendOTP({ user, otp }) {
            const actionCtx = ctx as ActionCtx;
            await actionCtx.scheduler?.runAfter(
              0,
              internal.emails.sendTwoFactorEmail,
              {
                userEmail: user.email,
                userName: user.name || undefined,
                code: otp,
              }
            );
          },
        },
        skipVerificationOnEnable: false, // Require verification when enabling 2FA
      }),
      admin(),
    ],
    // Database hooks for email, notifications, and activity logging
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (!user) return;
            console.log('🚀 New user created:', user.email);

            const actionCtx = ctx as ActionCtx;

            // Schedule action to handle new user (emails, notifications, logging)
            // The action will look up the user by email to get the Convex ID
            await actionCtx.scheduler?.runAfter(
              0,
              internal.authHooks.onUserCreated,
              {
                email: user.email,
                name: user.name || undefined,
                betterAuthUserId: user.id, // Pass Better Auth user ID
              }
            );
          },
        },
        update: {
          after: async (user) => {
            if (!user) return;

            const actionCtx = ctx as ActionCtx;

            // Schedule action to log profile update
            await actionCtx.scheduler?.runAfter(
              0,
              internal.authHooks.onUserUpdated,
              {
                email: user.email,
                updatedFields: Object.keys(user),
              }
            );
          },
        },
      },
      session: {
        create: {
          after: async (session) => {
            if (!session) return;

            const actionCtx = ctx as ActionCtx;

            // Schedule action to log login
            // Pass the Better Auth user ID, the action will handle the mapping
            await actionCtx.scheduler?.runAfter(
              0,
              internal.authHooks.onSessionCreated,
              {
                betterAuthUserId: session.userId, // Better Auth's user ID
                sessionId: session.id,
                ipAddress: session.ipAddress || undefined,
                userAgent: session.userAgent || undefined,
              }
            );
          },
        },
      },
    },
  } satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx) => {
  const options = createOptions(ctx);
  return betterAuth({
    ...options,
    plugins: [
      ...options.plugins,
      customSession(async ({ user, session }) => {
        const userId = user.id as Id<'users'>;
        const subscriptionWithUser = await ctx.runQuery(
          internal.subscriptions.getActiveSubscriptionInternal,
          {
            betterAuthUserId: userId,
          }
        );

        return {
          user: user,
          dbUser: subscriptionWithUser?.user,
          session,
          subscription: subscriptionWithUser?.subscription,
        };
      }, options),
    ],
  });
};

export type Auth = ReturnType<typeof createAuth>;
export type Session = ReturnType<typeof createAuth>['$Infer']['Session'];
export type User = ReturnType<typeof createAuth>['$Infer']['Session']['user'];
