import { useAuth } from '@/lib/auth-context';
import {
  UseMutationOptions,
  useMutation as useTanStackMutation,
} from '@tanstack/react-query';
import { makeUseQueryWithStatus } from 'convex-helpers/react';
import {
  useAction,
  useMutation as useConvexReactMutation,
  useQueries,
  useConvexAuth,
} from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
import React, { useEffect, useRef } from 'react';

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

type AnyConvexQuery = FunctionReference<'query', any, any, any>;

type AnyConvexMutation = FunctionReference<'mutation', any, any, any>;

type AnyConvexAction = FunctionReference<'action', any, any, any>;

type MutationReturnType<M extends AnyConvexMutation> =
  M extends FunctionReference<'mutation', any, infer Args, infer Output>
    ? Output
    : never;

export function useCustomQuery<Q extends AnyConvexQuery>(
  query: Q,
  args: FunctionArgs<Q>,
  options?: {
    enabled?: boolean;
  }
) {
  const fullArgs = {
    ...(args as object),
  } as FunctionArgs<Q>;

  return useQueryWithStatus(
    query,
    options?.enabled === false ? ('skip' as any) : fullArgs
  );
}

export function useCustomMutation<M extends AnyConvexMutation>(
  convexMutationFnRef: M
): {
  mutate: (args: FunctionArgs<M>) => Promise<MutationReturnType<M>>;
  isPending: boolean;
  status: 'idle' | 'pending' | 'success' | 'error';
  error: Error | undefined;
} {
  const convexMutateWithSession = useConvexReactMutation(convexMutationFnRef);

  const tanStackMutationResult = useTanStackMutation<
    MutationReturnType<M>,
    Error,
    FunctionArgs<M>
  >({
    mutationFn: async (variables: FunctionArgs<M>) => {
      const fullArgs = {
        ...(variables as object),
      } as FunctionArgs<M>;
      return convexMutateWithSession(fullArgs);
    },
  });

  return {
    mutate: tanStackMutationResult.mutateAsync,
    isPending: tanStackMutationResult.isPending,
    status: tanStackMutationResult.status,
    error: tanStackMutationResult.error ?? undefined,
  };
}

export function useAuthQuery<Q extends AnyConvexQuery>(
  query: Q,
  args?: FunctionArgs<Q>,
  options?: {
    enabled?: boolean;
  }
) {
  const { session, isLoading: isSessionPending, isConvexReady } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const retryCountRef = useRef(0);
  const [retryTrigger, setRetryTrigger] = React.useState(0);

  // Don't run query until we have both Better Auth session AND Convex auth
  const shouldSkip =
    options?.enabled === false ||
    isSessionPending ||
    !isConvexReady ||
    !session ||
    !isAuthenticated;

  const result = useCustomQuery(query, args, {
    ...options,
    enabled: !shouldSkip,
  });

  // Handle authentication errors with retry
  useEffect(() => {
    if (
      result.error?.message === 'Not authenticated' &&
      session &&
      retryCountRef.current < 3
    ) {
      // If we have a session but got auth error, it's likely a race condition
      // Wait a bit and retry
      const timeoutId = setTimeout(
        () => {
          retryCountRef.current += 1;
          setRetryTrigger((prev) => prev + 1);
        },
        100 * Math.pow(2, retryCountRef.current)
      ); // Exponential backoff: 100ms, 200ms, 400ms

      return () => clearTimeout(timeoutId);
    } else if (!result.error || result.error?.message !== 'Not authenticated') {
      // Reset retry count on successful query or different error
      retryCountRef.current = 0;
    }
  }, [result.error, session, retryTrigger]);

  return result;
}

export function useAuthMutation<M extends AnyConvexMutation>(
  mutation: M | undefined,
  options?: UseMutationOptions<MutationReturnType<M>, Error, FunctionArgs<M>>
) {
  const { session, isLoading: isSessionPending } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const convexMutateWithSession = useConvexReactMutation(mutation!);

  const tanStackMutationResult = useTanStackMutation<
    MutationReturnType<M>,
    Error,
    FunctionArgs<M>
  >({
    mutationFn: async (variables: FunctionArgs<M>) => {
      const fullArgs = {
        ...(variables as object),
      } as FunctionArgs<M>;

      // If session is pending or Convex auth is not ready, wait for it
      if (isSessionPending || !isAuthenticated) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Retry logic for auth race conditions
      let retries = 0;
      while (retries < 3) {
        try {
          return await convexMutateWithSession(fullArgs);
        } catch (error: any) {
          if (
            error?.message === 'Not authenticated' &&
            session &&
            retries < 2
          ) {
            // Wait with exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, 100 * Math.pow(2, retries))
            );
            retries++;
          } else {
            throw error;
          }
        }
      }

      throw new Error('Failed after retries');
    },
    ...options,
  });

  return {
    mutate: tanStackMutationResult.mutateAsync,
    isPending: tanStackMutationResult.isPending,
    status: tanStackMutationResult.status,
    error: tanStackMutationResult.error ?? undefined,
  };
}

export function useAuthAction<A extends AnyConvexAction>(action: A) {
  const { session } = useAuth();
  const actionFn = useAction(action);

  return {
    execute: async (args?: FunctionArgs<A>) => {
      const fullArgs = {
        ...(args as object),
      } as FunctionArgs<A>;

      return actionFn(fullArgs);
    },
    isAuthenticated: !!session?.session?.token,
  };
}
