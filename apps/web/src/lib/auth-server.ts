import { headers, cookies } from 'next/headers';
import { cache } from 'react';
import { Session, User } from './auth-client';

// Cache the server session to avoid multiple fetches in the same request
export const getServerSession = cache(async () => {
  try {
    // Get the request headers and cookies
    const headersList = await headers();
    const cookieStore = await cookies();

    // Build the URL for the API route
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const host = headersList.get('host') || 'localhost:3000';
    const url = `${protocol}://${host}/api/auth/get-session`;

    // Forward all cookies to the API route
    const cookieHeader = cookieStore.toString();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(
        'Failed to get session:',
        response.status,
        response.statusText
      );
      return null;
    }

    const data = (await response.json()) as Session;

    if (!data || !data.session || !data.user) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
});

// Get the auth token for Convex
export const getConvexAuthToken = async () => {
  const sessionData = await getServerSession();

  // Better Auth session token is what Convex expects
  if (!sessionData?.session?.token && !sessionData?.session?.id) {
    return null;
  }

  // Return the session token or id that Convex can validate
  return sessionData.session.token || sessionData.session.id;
};

// Check if user is authenticated on server-side
export const isAuthenticatedServer = async () => {
  const session = await getServerSession();
  return !!session;
};
