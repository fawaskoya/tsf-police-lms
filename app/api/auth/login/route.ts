import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

interface LoginRequest {
  email: string;
  password: string;
}

// Demo users for development
const demoUsers = {
  'super@kbn.local': {
    id: '1',
    email: 'super@kbn.local',
    name: 'أحمد الكبير',
    role: 'super_admin',
    unit: 'Command',
    rank: 'Colonel',
    locale: 'ar',
  },
  'admin@kbn.local': {
    id: '2',
    email: 'admin@kbn.local',
    name: 'محمد العبدالله',
    role: 'admin',
    unit: 'Training',
    rank: 'Major',
    locale: 'ar',
  },
  'instructor@kbn.local': {
    id: '3',
    email: 'instructor@kbn.local',
    name: 'فاطمة السعد',
    role: 'instructor',
    unit: 'Academy',
    rank: 'Captain',
    locale: 'ar',
  },
  'commander@kbn.local': {
    id: '4',
    email: 'commander@kbn.local',
    name: 'خالد المنصوري',
    role: 'commander',
    unit: 'Operations',
    rank: 'Lieutenant Colonel',
    locale: 'ar',
  },
  'trainee@kbn.local': {
    id: '5',
    email: 'trainee@kbn.local',
    name: 'سارة الأحمد',
    role: 'trainee',
    unit: 'Patrol',
    rank: 'Sergeant',
    locale: 'ar',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json();

    console.log('🔐 Custom login attempt:', { email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check demo users (for development)
    const user = demoUsers[email as keyof typeof demoUsers];

    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (password !== 'Passw0rd!') {
      console.log('❌ Invalid password for:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful for:', email, 'role:', user.role);

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
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
        name: user.name,
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

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
