import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { Auth } from '@invoice-tracker/backend/convex/auth';
import { polarClient } from '@polar-sh/better-auth';
import {
  adminClient,
  inferAdditionalFields,
  customSessionClient,
  magicLinkClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    convexClient(),
    magicLinkClient(),
    polarClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        // Will be handled by individual sign-in components
        window.location.href = '/auth/verify-2fa';
      },
    }),
    adminClient(),
    inferAdditionalFields<Auth>(),
    customSessionClient<Auth>(),
    // Other plugins
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = (typeof authClient.$Infer.Session)['user'];
export type DbUser = (typeof authClient.$Infer.Session)['dbUser'];
