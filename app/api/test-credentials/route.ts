import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Get the credentials provider
    const credentialsProvider = authOptions.providers.find(
      (provider) => provider.id === 'credentials'
    ) as ReturnType<typeof CredentialsProvider>;

    if (!credentialsProvider || !credentialsProvider.authorize) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credentials provider not found or misconfigured' 
      }, { status: 500 });
    }

    // Test the authorize function directly
    const user = await credentialsProvider.authorize(
      { email, password, csrfToken: '' }, // csrfToken is not used in authorize logic for demo
      {} as any // req object is not used in demo authorize logic
    );

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          unit: user.unit,
          rank: user.rank,
          locale: user.locale,
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        provided: { email, password: password ? 'PROVIDED' : 'NOT_PROVIDED' },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to verify credentials',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
