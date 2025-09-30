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

    // Get completion trend data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get certificates issued by month
    const certificatesByMonth = await db.certificate.groupBy({
      by: ['issuedAt'],
      where: {
        issuedAt: {
          gte: twelveMonthsAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        issuedAt: 'asc'
      }
    });

    // Get enrollments by month
    const enrollmentsByMonth = await db.enrollment.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Generate monthly data for the last 12 months
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Find certificates issued in this month
      const certificatesInMonth = certificatesByMonth.filter(cert => {
        const certMonth = new Date(cert.issuedAt);
        return certMonth.getFullYear() === monthDate.getFullYear() && 
               certMonth.getMonth() === monthDate.getMonth();
      });
      
      // Find enrollments in this month
      const enrollmentsInMonth = enrollmentsByMonth.filter(enroll => {
        const enrollMonth = new Date(enroll.createdAt);
        return enrollMonth.getFullYear() === monthDate.getFullYear() && 
               enrollMonth.getMonth() === monthDate.getMonth();
      });

      const totalEnrollments = enrollmentsInMonth.reduce((sum, enroll) => sum + enroll._count.id, 0);
      const totalCompletions = certificatesInMonth.reduce((sum, cert) => sum + cert._count.id, 0);
      
      const completionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

      monthlyData.push({
        month: monthKey,
        monthName: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        completions: totalCompletions,
        enrollments: totalEnrollments,
        completionRate: Math.round(completionRate * 10) / 10
      });
    }

    // Get course-specific completion data
    const courseCompletions = await db.course.findMany({
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        enrollments: {
          select: {
            id: true
          }
        },
        certificates: {
          select: {
            id: true
          }
        }
      }
    });

    const courseCompletionData = courseCompletions.map(course => {
      const totalEnrollments = course.enrollments.length;
      const totalCompletions = course.certificates.length;
      const completionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

      return {
        courseId: course.id,
        titleEn: course.titleEn,
        titleAr: course.titleAr,
        totalEnrollments,
        totalCompletions,
        completionRate: Math.round(completionRate * 10) / 10
      };
    });

    return NextResponse.json({
      monthlyTrend: monthlyData,
      courseCompletions: courseCompletionData.sort((a, b) => b.completionRate - a.completionRate)
    });
  } catch (error) {
    console.error('Error fetching completion trend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
