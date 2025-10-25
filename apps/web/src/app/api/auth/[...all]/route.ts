import { nextJsHandler } from '@convex-dev/better-auth/nextjs';

// Derive the Convex site URL from the WebSocket URL
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexSiteUrl = convexUrl
  ? convexUrl.replace('wss:', 'https:').replace('.convex.cloud', '.convex.site')
  : undefined;

export const { GET, POST } = nextJsHandler({
  convexSiteUrl,
});
