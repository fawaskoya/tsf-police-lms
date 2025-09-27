import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const languageSchema = z.object({
  locale: z.enum(['ar', 'en']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale } = languageSchema.parse(body);

    const response = NextResponse.json({ success: true });

    // Set cookie for language preference (expires in 1 year)
    response.cookies.set('preferred-language', locale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
