import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import createMiddleware from 'next-intl/middleware';
import { canAccessRoute } from '@/lib/permissions';
import { Role } from '@/lib/roles';
// UserRole import removed - using normalized Role from lib/roles

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ar'],

  // If this locale is matched but there is no corresponding page,
  // send users to this default locale by default
  defaultLocale: 'ar'
});

export default async function middleware(request: NextRequest) {
  // First run the intl middleware
  const intlResponse = intlMiddleware(request);

  // If intl middleware returns a response (redirect), return it
  if (intlResponse) {
    return intlResponse;
  }

  const pathname = request.nextUrl.pathname;

  // Get token for protected routes
  const authToken = request.cookies.get('auth-token')?.value;
  let token: any = null;

  if (authToken) {
    try {
      token = jwt.verify(authToken, process.env.NEXTAUTH_SECRET || 'fallback-secret');
    } catch (error) {
      console.log('Invalid token in middleware:', error);
    }
  }

  // Check route access permissions
  if (pathname.startsWith('/admin') || pathname.startsWith('/commander') || pathname.startsWith('/instructor') || pathname.startsWith('/trainee')) {
    if (!token) {
      // Extract locale from pathname (e.g., /ar/admin -> ar)
      const localeMatch = pathname.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : 'ar';
      const loginUrl = new URL(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(request.url)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as Role;
    const routePath = pathname.replace(/^\/[a-z]{2}/, '');

    if (!canAccessRoute(userRole, routePath)) {
      const localeMatch = pathname.match(/^\/([a-z]{2})/);
      const locale = localeMatch ? localeMatch[1] : 'ar';
      const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
