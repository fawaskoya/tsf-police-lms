import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Test the demo users directly
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
    
    console.log('Direct test:', {
      email,
      passwordProvided: !!password,
      passwordMatch: password === 'Passw0rd!',
      userFound: !!user,
      userEmail: user?.email
    });

    if (!user || password !== 'Passw0rd!') {
      console.log('Direct test failed:', { userFound: !!user, passwordMatch: password === 'Passw0rd!' });
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
        provided: { email, password: password ? 'PROVIDED' : 'NOT_PROVIDED' },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

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
