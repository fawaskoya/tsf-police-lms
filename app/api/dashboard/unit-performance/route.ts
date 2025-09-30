import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'reports:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all units
    const units = await db.user.groupBy({
      by: ['unit'],
      where: {
        unit: {
          not: null
        }
      },
      _count: {
        id: true
      }
    });

    // Get unit performance data
    const unitPerformance = await Promise.all(
      units.map(async (unit) => {
        // Get trainees in this unit
        const trainees = await db.user.count({
          where: {
            unit: unit.unit,
            role: 'trainee'
          }
        });

        // Get exam attempts for trainees in this unit
        const attempts = await db.attempt.findMany({
          where: {
            user: {
              unit: unit.unit,
              role: 'trainee'
            }
          },
          select: {
            score: true,
            exam: {
              select: {
                totalMarks: true
              }
            }
          }
        });

        // Calculate pass rate (assuming 60% is passing)
        const passedAttempts = attempts.filter(attempt => 
          attempt.score && attempt.exam.totalMarks && 
          (attempt.score / attempt.exam.totalMarks) * 100 >= 60
        ).length;

        const passRate = attempts.length > 0 ? (passedAttempts / attempts.length) * 100 : 0;

        return {
          unit: unit.unit || 'Unknown',
          traineeCount: trainees,
          passRate: Math.round(passRate),
          totalAttempts: attempts.length
        };
      })
    );

    // Sort by pass rate descending
    unitPerformance.sort((a, b) => b.passRate - a.passRate);

    return NextResponse.json({
      unitPerformance
    });
  } catch (error) {
    console.error('Error fetching unit performance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
