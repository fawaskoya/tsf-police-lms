import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      hasSession: !!session,
      user: session?.user || null,
      role: session?.user?.role || null,
      timestamp: new Date().toISOString(),
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Test the exact same logic as in auth.ts
    const demoUsers = {
      'super@kbn.local': {
        id: '1',
        email: 'super@kbn.local',
        name: 'أحمد الكبير',
        role: 'super_admin' as const,
        unit: 'Command',
        rank: 'Colonel',
        locale: 'ar',
        status: 'ACTIVE' as const,
      },
    };

    const user = demoUsers[email as keyof typeof demoUsers];
    
    if (!user || password !== 'Passw0rd!') {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        provided: { email, password: password ? 'PROVIDED' : 'NOT_PROVIDED' },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

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
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to verify credentials',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
