'use client';

import { useConvexAuth } from 'convex/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient, Session } from './auth-client';

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  isConvexReady: boolean; // New field to track Convex auth readiness
  signIn: typeof authClient.signIn;
  signUp: typeof authClient.signUp;
  signOut: () => Promise<void>;
  refetchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{
  children: React.ReactNode;
  initialSession: Session | null;
}> = ({ children, initialSession }) => {
  const {
    data: sessionFromClient,
    isPending,
    refetch,
  } = authClient.useSession();

  // Get Convex auth state
  const { isAuthenticated, isLoading: isConvexLoading } = useConvexAuth();

  // Convert initialSession format to match Session type if needed
  const [session, setSession] = useState<Session | null>(
    initialSession || sessionFromClient
  );

  // Only show loading when we're actually fetching session data
  // Not having a session is not a loading state, it's a valid state
  const isLoading = initialSession === null && isPending;

  // Convex is ready when it's not loading AND either authenticated or explicitly not authenticated
  const isConvexReady = !isConvexLoading && (isAuthenticated || !session);

  useEffect(() => {
    // Update session when it changes, including when it becomes null
    if (sessionFromClient !== undefined) {
      setSession(sessionFromClient);
    }
  }, [sessionFromClient]);

  // Custom signOut that properly clears the session
  const signOut = async () => {
    try {
      // Call the auth client signOut
      await authClient.signOut();
      // Immediately clear the session state
      setSession(null);
      // Optionally refetch to ensure sync
      refetch();
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if signOut fails, clear the local session
      setSession(null);
      throw error;
    }
  };

  const value = {
    session,
    isLoading,
    isConvexReady,
    signIn: authClient.signIn,
    signUp: authClient.signUp,
    signOut,
    refetchSession: refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
