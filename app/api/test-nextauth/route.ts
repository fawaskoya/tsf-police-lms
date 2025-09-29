import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Test if NextAuth is working at all
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      nextAuthWorking: true,
      hasSession: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
      authOptions: {
        providers: authOptions.providers?.length || 0,
        sessionStrategy: authOptions.session?.strategy || 'unknown',
        secretSet: !!process.env.NEXTAUTH_SECRET,
        useSecureCookies: authOptions.useSecureCookies,
      }
    });
  } catch (error) {
    return NextResponse.json({
      nextAuthWorking: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
