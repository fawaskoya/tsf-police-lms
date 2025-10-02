import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { canAccessRoute } from '@/lib/permissions';
import { Role } from '@/lib/roles';
// UserRole import removed - using normalized Role from lib/roles

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  unit: string;
  rank: string;
  locale: string;
  exp?: number;
}

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ar'],

  // If this locale is matched but there is no corresponding page,
  // send users to this default locale by default
  defaultLocale: 'en'
});

export default async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const pathname = request.nextUrl.pathname;
    console.log(`🔍 Middleware [${requestId}]:`, pathname);

    // First run the intl middleware
    const intlResponse = intlMiddleware(request);

    // If intl middleware returns a response (redirect), return it
    if (intlResponse && intlResponse.status >= 300 && intlResponse.status < 400) {
      console.log(`🌐 Intl redirect [${requestId}]:`, intlResponse.headers.get('location'));
      return intlResponse;
    }
    console.log(`🌐 Intl check passed [${requestId}], continuing...`);

    // Get token for protected routes
    const authToken = request.cookies.get('auth-token')?.value;
    console.log('🔑 Auth token present:', !!authToken);
    
    const token = authToken ? await verifyJwtToken(authToken) : null;
    console.log('👤 User role:', token?.role || 'none');

    // Handle root route - redirect authenticated users to their dashboard
    if (pathname === '/' || pathname.match(/^\/[a-z]{2}$/)) {
      if (token) {
        const localeMatch = pathname.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        
        let dashboardPath = '/admin'; // default
        switch (token.role) {
          case 'super_admin':
          case 'admin':
            dashboardPath = '/admin';
            break;
          case 'instructor':
            dashboardPath = '/instructor';
            break;
          case 'commander':
            dashboardPath = '/commander';
            break;
          case 'trainee':
            dashboardPath = '/trainee';
            break;
        }
        
        const dashboardUrl = new URL(`/${locale}${dashboardPath}`, request.url);
        console.log(`✅ Authenticated - redirecting to ${dashboardPath}`);
        return NextResponse.redirect(dashboardUrl);
      }
      // If not authenticated, allow access to homepage
      console.log('🏠 Allowing access to homepage');
    }

    // Check route access permissions for protected routes
    const isProtectedRoute = 
      pathname.match(/^\/[a-z]{2}\/admin/) || 
      pathname.match(/^\/[a-z]{2}\/commander/) || 
      pathname.match(/^\/[a-z]{2}\/instructor/) || 
      pathname.match(/^\/[a-z]{2}\/trainee/);
      
    if (isProtectedRoute) {
      console.log('🔒 Protected route detected');
      
      if (!token) {
        // Extract locale from pathname (e.g., /ar/admin -> ar)
        const localeMatch = pathname.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        const loginUrl = new URL(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(request.url)}`, request.url);
        console.log('🚫 No token - redirecting to login');
        return NextResponse.redirect(loginUrl);
      }

      const userRole = token.role;
      const routePath = pathname.replace(/^\/[a-z]{2}/, '');

      // Check permissions for protected routes
      const hasAccess = canAccessRoute(userRole, routePath);
      console.log(`🔐 Permission check for ${routePath}:`, hasAccess);
      
      if (!hasAccess) {
        const localeMatch = pathname.match(/^\/([a-z]{2})/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        const unauthorizedUrl = new URL(`/${locale}/unauthorized`, request.url);
        console.log('⛔ Access denied - redirecting to unauthorized');
        return NextResponse.redirect(unauthorizedUrl);
      }
    }

    console.log('✓ Request allowed');

    return NextResponse.next();
  } catch (error) {
    const errorDetails = {
      requestId,
      pathname: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
      } : { message: String(error) },
    };

    console.error(`💥 Middleware error [${requestId}]:`, errorDetails);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION_MIDDLEWARE_ERROR:', JSON.stringify(errorDetails));
    }

    // Always allow the request to continue to prevent blocking users
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

async function verifyJwtToken(token: string): Promise<TokenPayload | null> {
  const [headerPart, payloadPart, signaturePart] = token.split('.');

  if (!headerPart || !payloadPart || !signaturePart) {
    console.warn('❌ Invalid JWT format');
    return null;
  }

  try {
    console.log('🔐 Verifying JWT token...');
    const signingInput = textEncoder.encode(`${headerPart}.${payloadPart}`);
    const signatureBytes = base64UrlToUint8Array(signaturePart);
    const headerJson = textDecoder.decode(base64UrlToUint8Array(headerPart));
    const header = JSON.parse(headerJson) as { alg?: string };

    if (header.alg && header.alg !== 'HS256') {
      console.warn('Unexpected JWT algorithm received in middleware:', header.alg);
      return null;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as any,
      signingInput as any
    );

    if (!isValid) {
      console.warn('❌ JWT signature invalid');
      return null;
    }

    const payloadJson = textDecoder.decode(base64UrlToUint8Array(payloadPart));
    const payload = JSON.parse(payloadJson) as TokenPayload;

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('❌ JWT expired');
      return null;
    }

    console.log('✅ JWT verified:', payload.role);
    return payload;
  } catch (error) {
    console.warn('💥 Failed to verify JWT in middleware:', error);
    return null;
  }
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 ? 4 - (padded.length % 4) : 0;
  const base64 = padded + '='.repeat(padding);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}
