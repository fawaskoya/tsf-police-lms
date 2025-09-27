import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError } from '@/lib/errorHandler';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    logger.info('Reports summary API request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'reports:read')) {
      throw new AuthorizationError('Insufficient permissions to access reports');
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // User statistics
    const totalUsers = await db.user.count();
    const activeUsers = await db.user.count({
      where: { status: 'ACTIVE' },
    });
    const newUsersThisMonth = await db.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Course statistics
    const totalCourses = await db.course.count();
    const publishedCourses = await db.course.count({
      where: { status: 'PUBLISHED' },
    });
    const totalEnrollments = await db.enrollment.count();

    // Exam and assessment statistics
    const totalExams = await db.exam.count();
    const totalAttempts = await db.attempt.count();
    const passedAttempts = await db.attempt.count({
      where: {
        score: {
          gte: 60, // Assuming 60% is passing
        },
      },
    });

    // Session and attendance statistics
    const totalSessions = await db.session.count();
    const upcomingSessions = await db.session.count({
      where: { startsAt: { gte: new Date() } },
    });
    const completedSessions = await db.session.count({
      where: { endsAt: { lt: new Date() } },
    });
    const totalAttendanceRecords = await db.attendance.count();

    // Certificate statistics
    const totalCertificates = await db.certificate.count();
    const certificatesThisMonth = await db.certificate.count({
      where: {
        issuedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Calculate averages and percentages
    const averageExamScore = totalAttempts > 0 ?
      (await db.attempt.aggregate({
        _avg: { score: true },
        where: { score: { not: null } },
      }))._avg.score || 0 : 0;

    const attendanceRate = totalSessions > 0 ?
      (totalAttendanceRecords / (totalSessions * 30)) * 100 : 0; // Assuming average 30 participants per session

    const courseCompletionRate = totalEnrollments > 0 ?
      (totalCertificates / totalEnrollments) * 100 : 0;

    const examPassRate = totalAttempts > 0 ?
      (passedAttempts / totalAttempts) * 100 : 0;

    // Role distribution
    const roleStats = await db.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Unit distribution
    const unitStats = await db.user.groupBy({
      by: ['unit'],
      _count: { unit: true },
      where: { unit: { not: null } },
    });

    // Monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const [newUsers, newCertificates, newAttempts] = await Promise.all([
        db.user.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
        db.certificate.count({ where: { issuedAt: { gte: monthStart, lte: monthEnd } } }),
        db.attempt.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
      ]);

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newUsers,
        newCertificates,
        examAttempts: newAttempts,
      });
    }

    const summary = {
      overview: {
        totalUsers,
        activeUsers,
        totalCourses,
        publishedCourses,
        totalExams,
        totalSessions,
        totalCertificates,
        totalEnrollments,
      },
      metrics: {
        userGrowth: newUsersThisMonth,
        courseCompletionRate: Math.round(courseCompletionRate * 100) / 100,
        examPassRate: Math.round(examPassRate * 100) / 100,
        averageExamScore: Math.round(averageExamScore * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        certificatesIssued: certificatesThisMonth,
      },
      distributions: {
        roles: roleStats.map(stat => ({
          role: stat.role,
          count: stat._count.role,
          percentage: Math.round((stat._count.role / totalUsers) * 100 * 100) / 100,
        })),
        units: unitStats.map(stat => ({
          unit: stat.unit,
          count: stat._count.unit,
          percentage: Math.round((stat._count.unit / totalUsers) * 100 * 100) / 100,
        })).filter(stat => stat.unit),
      },
      trends: monthlyTrends,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    logger.info('Reports summary generated successfully', {
      totalUsers,
      totalCourses,
      totalExams,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/reports/summary',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}