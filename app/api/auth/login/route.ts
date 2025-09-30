import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Login request received');
    
    const body = await request.json();
    const { email, password }: LoginRequest = body;

    console.log('🔐 Login attempt:', { email, hasPassword: !!password, bodyKeys: Object.keys(body) });

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        unit: true,
        rank: true,
        locale: true,
        status: true,
      },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      console.log('❌ User is not active:', email, 'Status:', user.status);
      return NextResponse.json(
        { success: false, error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      console.log('❌ No password set for user:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful for:', email, 'role:', user.role);

    const userName = `${user.firstName} ${user.lastName}`;

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: userName,
        role: user.role,
        unit: user.unit,
        rank: user.rank,
        locale: user.locale,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: userName,
        role: user.role,
        unit: user.unit,
        rank: user.rank,
        locale: user.locale,
      },
    });

    // Set HTTP-only cookie
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    response.headers.set('Set-Cookie', cookie);

    console.log('🍪 Cookie set:', cookie.split(';')[0]);
    console.log('📤 Login response ready');

    return response;

  } catch (error) {
    console.error('💥 Login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
