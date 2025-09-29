import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🧪 TEST LOGIN:', { email, password });

    // Simple demo auth - always return success
    if (email && password) {
      console.log('✅ TEST LOGIN SUCCESS');
      return NextResponse.json({
        success: true,
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: 'super_admin'
        },
        message: 'Login successful'
      });
    } else {
      console.log('❌ TEST LOGIN FAILED - missing credentials');
      return NextResponse.json({
        success: false,
        error: 'Missing credentials'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
