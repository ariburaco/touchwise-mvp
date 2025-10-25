import Providers from '@/components/providers';
import { getServerSession } from '@/lib/auth-server';
import { Loader2 } from 'lucide-react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import '../globals.css';
import '../styles/print.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Convex Template',
  description: 'Convex Template for Next.js',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen">
              <Loader2 className="animate-spin" />
            </div>
          }
        >
          <Providers initialSession={session}>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
