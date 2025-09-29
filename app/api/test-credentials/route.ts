import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Demo user authentication (same as in auth.ts)
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
      'admin@kbn.local': {
        id: '2',
        email: 'admin@kbn.local',
        name: 'محمد العبدالله',
        role: 'admin' as const,
        unit: 'Training',
        rank: 'Major',
        locale: 'ar',
        status: 'ACTIVE' as const,
      },
      'instructor@kbn.local': {
        id: '3',
        email: 'instructor@kbn.local',
        name: 'فاطمة السعد',
        role: 'instructor' as const,
        unit: 'Academy',
        rank: 'Captain',
        locale: 'ar',
        status: 'ACTIVE' as const,
      },
      'commander@kbn.local': {
        id: '4',
        email: 'commander@kbn.local',
        name: 'خالد المنصوري',
        role: 'commander' as const,
        unit: 'Operations',
        rank: 'Lieutenant Colonel',
        locale: 'ar',
        status: 'ACTIVE' as const,
      },
      'trainee@kbn.local': {
        id: '5',
        email: 'trainee@kbn.local',
        name: 'سارة الأحمد',
        role: 'trainee' as const,
        unit: 'Patrol',
        rank: 'Sergeant',
        locale: 'ar',
        status: 'ACTIVE' as const,
      },
    };

    const user = demoUsers[email as keyof typeof demoUsers];
    
    if (!user || password !== 'Passw0rd!') {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
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
