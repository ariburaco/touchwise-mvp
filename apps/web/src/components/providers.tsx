'use client';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { authClient, Session } from '@/lib/auth-client';
import { AuthProvider } from '@/lib/auth-context';
import '@/lib/i18n';
import { LanguageProvider } from '@/lib/language-context';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConvexReactClient } from 'convex/react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from './ui/sonner';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {});

const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
  initialSession: Session | null;
}

export default function Providers({
  children,
  initialSession,
}: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <AuthProvider initialSession={initialSession}>
            <SubscriptionProvider>
              <SettingsProvider>
                <LanguageProvider>{children}</LanguageProvider>
              </SettingsProvider>
            </SubscriptionProvider>
            <Toaster richColors />
          </AuthProvider>
        </ConvexBetterAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
