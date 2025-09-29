import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const markAttendanceSchema = z.object({
  userId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
  method: z.enum(['QR', 'MANUAL', 'IMPORT']).default('MANUAL'),
  notes: z.string().optional(),
});

const bulkAttendanceSchema = z.array(z.object({
  userId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
  method: z.enum(['QR', 'MANUAL', 'IMPORT']).default('MANUAL'),
  notes: z.string().optional(),
}));

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Session attendance API GET request initiated', {
      url: request.url,
      method: request.method,
      sessionId: params.id,
    });

    const sessionAuth = await getServerSession();

    if (!sessionAuth) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(sessionAuth.user.role, 'sessions:read')) {
      throw new AuthorizationError('Insufficient permissions to read attendance');
    }

    // Check if session exists
    const session = await db.session.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      throw new NotFoundError('Session not found', { sessionId: params.id });
    }

    const attendance = await db.attendance.findMany({
      where: { sessionId: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNo: true,
            rank: true,
            unit: true,
            email: true,
          },
        },
        capturer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { capturedAt: 'desc' },
    });

    logger.info('Session attendance fetched successfully', {
      sessionId: params.id,
      attendanceCount: attendance.length,
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/sessions/${params.id}/attendance`,
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Session attendance API POST request initiated', {
      url: request.url,
      method: request.method,
      sessionId: params.id,
    });

    const sessionAuth = await getServerSession();

    if (!sessionAuth) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(sessionAuth.user.role, 'sessions:write')) {
      throw new AuthorizationError('Insufficient permissions to mark attendance');
    }

    // Check if session exists
    const session = await db.session.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      throw new NotFoundError('Session not found', { sessionId: params.id });
    }

    const body = await request.json();

    // Handle bulk attendance
    if (Array.isArray(body)) {
      const attendanceData = validateInput(bulkAttendanceSchema, body, {
        endpoint: `/api/sessions/${params.id}/attendance`,
        method: 'POST',
      });

      const results = [];
      for (const record of attendanceData) {
        try {
          const attendance = await db.attendance.upsert({
            where: {
              sessionId_userId: {
                sessionId: params.id,
                userId: record.userId,
              },
            },
            update: {
              status: record.status,
              method: record.method,
              notes: record.notes,
              capturedBy: sessionAuth.user.id,
              capturedAt: new Date(),
            },
            create: {
              sessionId: params.id,
              userId: record.userId,
              status: record.status,
              method: record.method,
              notes: record.notes,
              capturedBy: sessionAuth.user.id,
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          results.push({
            success: true,
            userId: record.userId,
            status: attendance.status,
          });
        } catch (error) {
          results.push({
            success: false,
            userId: record.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Audit log
      await createAuditLog({
        actorId: sessionAuth.user.id,
        action: 'BULK_ATTENDANCE',
        entity: 'Session',
        entityId: params.id,
        metadata: {
          recordsProcessed: attendanceData.length,
          successful: results.filter(r => r.success).length,
        },
      });

      logger.info('Bulk attendance marked successfully', {
        sessionId: params.id,
        processed: attendanceData.length,
        successful: results.filter(r => r.success).length,
      });

      return NextResponse.json({ results });
    } else {
      // Handle single attendance record
      const attendanceData = validateInput(markAttendanceSchema, body, {
        endpoint: `/api/sessions/${params.id}/attendance`,
        method: 'POST',
      });

      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: attendanceData.userId },
      });

      if (!user) {
        throw new NotFoundError('User not found', { userId: attendanceData.userId });
      }

      const attendance = await db.attendance.upsert({
        where: {
          sessionId_userId: {
            sessionId: params.id,
            userId: attendanceData.userId,
          },
        },
        update: {
          status: attendanceData.status,
          method: attendanceData.method,
          notes: attendanceData.notes,
          capturedBy: sessionAuth.user.id,
          capturedAt: new Date(),
        },
        create: {
          sessionId: params.id,
          userId: attendanceData.userId,
          status: attendanceData.status,
          method: attendanceData.method,
          notes: attendanceData.notes,
          capturedBy: sessionAuth.user.id,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Audit log
      await createAuditLog({
        actorId: sessionAuth.user.id,
        action: 'MARK_ATTENDANCE',
        entity: 'Session',
        entityId: params.id,
        metadata: {
          userId: attendanceData.userId,
          status: attendanceData.status,
          method: attendanceData.method,
        },
      });

      logger.info('Attendance marked successfully', {
        sessionId: params.id,
        userId: attendanceData.userId,
        status: attendanceData.status,
      });

      return NextResponse.json({ attendance });
    }
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/sessions/${params.id}/attendance`,
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
