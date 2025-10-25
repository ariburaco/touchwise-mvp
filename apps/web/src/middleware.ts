import { NextRequest, NextResponse } from 'next/server';
import { supportedLanguages } from '@invoice-tracker/translations';

const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify-2fa',
  '/auth/magic-link',
  '/auth/reset-password',
];
const signInRoutes = ['/auth/login', '/auth/signup', '/auth/verify-2fa', '/auth/magic-link', '/auth/reset-password'];
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request: NextRequest) {
  // Skip middleware for API routes, static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get the preferred language from cookie or Accept-Language header
  const cookieLanguage = request.cookies.get('preferred_language')?.value;
  const acceptLanguage = request.headers.get('accept-language');

  let preferredLanguage = 'en'; // default

  // Check cookie first
  if (cookieLanguage && supportedLanguages.includes(cookieLanguage as any)) {
    preferredLanguage = cookieLanguage;
  } else if (acceptLanguage) {
    // Parse Accept-Language header
    const browserLanguage = acceptLanguage.split(',')[0].split('-')[0];
    if (supportedLanguages.includes(browserLanguage as any)) {
      preferredLanguage = browserLanguage;
    }
  }

  const sessionCookie = getSessionCookie(request);
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (isPublicRoute && !sessionCookie) {
    return NextResponse.next();
  }

  if (!isPublicRoute && !sessionCookie) {
    console.log('Redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const isSignInRoute = signInRoutes.includes(request.nextUrl.pathname);
  // already logged in, redirect to dashboard
  if (isSignInRoute && sessionCookie) {
    console.log('Redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Create response and set language cookie
  const response = NextResponse.next();

  // Set the language cookie if not already set or if it's different
  if (!cookieLanguage || cookieLanguage !== preferredLanguage) {
    response.cookies.set('preferred_language', preferredLanguage, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
