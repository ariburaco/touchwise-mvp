import {
  customAction,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions';
import { UserIdentity } from 'convex/server';
import { Doc, Id } from '../_generated/dataModel';
import {
  ActionCtx,
  action as baseAction,
  mutation as baseMutation,
  query as baseQuery,
  type MutationCtx,
  type QueryCtx,
} from '../_generated/server';
import { ConvexError } from 'convex/values';

type AuthedCtxExtensions = {
  userId: Id<'users'>; // userId might be undefined if session is null
  userIdentity: UserIdentity;
  userSubscription: Doc<'subscriptions'>;
  user: Doc<'users'>;
};

export const authedQuery = customQuery(baseQuery, {
  args: {},
  input: async (
    ctx: QueryCtx
  ): Promise<{ ctx: QueryCtx & AuthedCtxExtensions; args: {} }> => {
    const userIdentity = await ctx.auth.getUserIdentity();

    if (!userIdentity?.subject) {
      throw new ConvexError('Not authenticated in authedQuery');
    }

    const userSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) =>
        q.eq('userId', userIdentity.subject as Id<'users'>)
      )
      .first();

    const user = await ctx.db.get(userIdentity.subject as Id<'users'>);

    return {
      // Augment the context
      ctx: {
        ...ctx,
        userId: userIdentity.subject,
        userIdentity: userIdentity,
        userSubscription: userSubscription,
        user: user,
      } as unknown as QueryCtx & AuthedCtxExtensions,
      args: {},
    };
  },
});

export const authedMutation = customMutation(baseMutation, {
  args: {},
  input: async (ctx: MutationCtx) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity?.subject) {
      throw new ConvexError('Not authenticated in authedMutation');
    }

    const userSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) =>
        q.eq('userId', userIdentity.subject as Id<'users'>)
      )
      .first();

    const user = await ctx.db.get(userIdentity.subject as Id<'users'>);

    return {
      // Augment the context
      ctx: {
        ...ctx,
        userId: userIdentity.subject,
        userIdentity: userIdentity,
        userSubscription: userSubscription,
        user: user,
      } as unknown as MutationCtx & AuthedCtxExtensions & { userId: string }, // userId is guaranteed string here
      args: {},
    };
  },
});

export const authedAction = customAction(baseAction, {
  args: {},
  input: async (ctx: ActionCtx) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity?.subject) {
      throw new ConvexError('Not authenticated in authedAction');
    }
    return {
      ctx: {
        ...ctx,
        userId: userIdentity.subject,
        userIdentity: userIdentity,
      } as unknown as ActionCtx & AuthedCtxExtensions,
      args: {},
    };
  },
});
