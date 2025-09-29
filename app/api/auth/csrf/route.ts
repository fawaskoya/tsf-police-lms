import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    // Generate a simple CSRF token for the form
    const csrfToken = crypto.randomBytes(32).toString('hex');

    return NextResponse.json({
      csrfToken
    });
  } catch (error) {
    console.error('CSRF token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
