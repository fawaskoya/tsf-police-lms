import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      return NextResponse.json({
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          unit: decoded.unit,
          rank: decoded.rank,
          locale: decoded.locale,
        }
      });
    } catch (error) {
      console.log('Invalid token:', error);
      // Clear invalid cookie
      const response = NextResponse.json({ user: null });
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
      return response;
    }

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { user: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
