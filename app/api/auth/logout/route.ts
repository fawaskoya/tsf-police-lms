import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Logout request');

    // Clear the auth cookie
    const cookie = serialize('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.headers.set('Set-Cookie', cookie);

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
