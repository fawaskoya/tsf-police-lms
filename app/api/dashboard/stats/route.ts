import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { isSuperAdmin } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'reports:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get dashboard statistics
    const [
      activeTrainees,
      totalUsers,
      totalCourses,
      totalExams,
      totalSessions,
      certificates,
      recentActivity
    ] = await Promise.all([
      // Active trainees (users with role trainee)
      db.user.count({
        where: {
          role: 'trainee',
          status: 'ACTIVE'
        }
      }),
      
      // Total users
      db.user.count(),
      
      // Total courses
      db.course.count({
        where: {
          status: 'PUBLISHED'
        }
      }),
      
      // Total exams
      db.exam.count(),
      
      // Sessions today
      db.session.count({
        where: {
          startsAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Certificates (for overdue calculation)
      db.certificate.findMany({
        select: {
          issuedAt: true,
          expiresAt: true,
        }
      }),
      
      // Recent activity (last 10 activities)
      db.auditLog.findMany({
        take: 10,
        orderBy: {
          ts: 'desc'
        },
        include: {
          actor: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    ]);

    // Calculate completion rate (simplified - based on certificates issued vs total enrollments)
    const totalEnrollments = await db.enrollment.count();
    const completionRate = totalEnrollments > 0 ? (certificates.length / totalEnrollments) * 100 : 0;

    // Calculate overdue certificates
    const now = new Date();
    const overdueCerts = certificates.filter(cert => 
      cert.expiresAt && cert.expiresAt < now
    ).length;

    // Calculate exam pass rate (simplified)
    const totalAttempts = await db.attempt.count();
    const passedAttempts = await db.attempt.count({
      where: {
        score: {
          gte: 60 // Assuming 60% is passing
        }
      }
    });
    const examPassRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

    const stats = {
      activeTrainees,
      completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
      overdueCerts,
      sessionsToday: totalSessions,
      examPassRate: Math.round(examPassRate * 10) / 10, // Round to 1 decimal
      totalUsers,
      totalCourses,
      totalExams,
    };

    // Format recent activity
    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      action: activity.action,
      user: `${activity.actor.firstName} ${activity.actor.lastName}` || activity.actor.email,
      details: activity.metadata || '',
      time: activity.ts.toISOString(),
    }));

    return NextResponse.json({
      stats,
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
