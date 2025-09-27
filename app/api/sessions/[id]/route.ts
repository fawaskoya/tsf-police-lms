import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const updateSessionSchema = z.object({
  courseId: z.string().optional(),
  titleAr: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  room: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  instructorId: z.string().optional(),
  capacity: z.number().min(1).optional(),
  mode: z.enum(['CLASSROOM', 'FIELD']).optional(),
  attendancePolicy: z.object({
    allowLateCheckin: z.boolean().default(false),
    lateCheckinMinutes: z.number().default(15),
    autoMarkAbsent: z.boolean().default(false),
    qrRequired: z.boolean().default(false),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Sessions API GET single request initiated', {
      url: request.url,
      method: request.method,
      sessionId: params.id,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'sessions:read')) {
      throw new AuthorizationError('Insufficient permissions to read sessions');
    }

    const sessionData = await db.session.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            code: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badgeNo: true,
                rank: true,
                unit: true,
              },
            },
            capturer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!sessionData) {
      throw new NotFoundError('Session not found', { sessionId: params.id });
    }

    logger.info('Session fetched successfully', {
      sessionId: sessionData.id,
      courseId: sessionData.courseId,
    });

    return NextResponse.json({ session: sessionData });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/sessions/${params.id}`,
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Sessions API PUT request initiated', {
      url: request.url,
      method: request.method,
      sessionId: params.id,
    });

    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(sessionAuth.user.role, 'sessions:write')) {
      throw new AuthorizationError('Insufficient permissions to update sessions');
    }

    const body = await request.json();
    const validatedData = validateInput(updateSessionSchema, body, {
      endpoint: `/api/sessions/${params.id}`,
      method: 'PUT',
    });

    // Check if session exists
    const existingSession = await db.session.findUnique({
      where: { id: params.id },
    });

    if (!existingSession) {
      throw new NotFoundError('Session not found', { sessionId: params.id });
    }

    // Validate time range if updating times
    let startsAt = existingSession.startsAt;
    let endsAt = existingSession.endsAt;

    if (validatedData.startsAt) {
      startsAt = new Date(validatedData.startsAt);
    }
    if (validatedData.endsAt) {
      endsAt = new Date(validatedData.endsAt);
    }

    if (startsAt >= endsAt) {
      throw new ValidationError('Session end time must be after start time');
    }

    const updatedSession = await db.session.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        ...(validatedData.startsAt && { startsAt }),
        ...(validatedData.endsAt && { endsAt }),
      },
      include: {
        course: {
          select: {
            titleAr: true,
            titleEn: true,
          },
        },
        instructor: {
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
      action: 'UPDATE',
      entity: 'Session',
      entityId: updatedSession.id,
      metadata: {
        changes: Object.keys(validatedData),
      },
    });

    logger.info('Session updated successfully', {
      sessionId: updatedSession.id,
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/sessions/${params.id}`,
      method: 'PUT',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Sessions API DELETE request initiated', {
      url: request.url,
      method: request.method,
      sessionId: params.id,
    });

    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(sessionAuth.user.role, 'sessions:delete')) {
      throw new AuthorizationError('Insufficient permissions to delete sessions');
    }

    // Check if session exists
    const existingSession = await db.session.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titleAr: true,
        startsAt: true,
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!existingSession) {
      throw new NotFoundError('Session not found', { sessionId: params.id });
    }

    // Prevent deleting sessions with attendance records
    if (existingSession._count.attendance > 0) {
      throw new ValidationError('Cannot delete session with attendance records');
    }

    // Prevent deleting sessions that have already started
    if (existingSession.startsAt < new Date()) {
      throw new ValidationError('Cannot delete sessions that have already started');
    }

    await db.session.delete({
      where: { id: params.id },
    });

    // Audit log
    await createAuditLog({
      actorId: sessionAuth.user.id,
      action: 'DELETE',
      entity: 'Session',
      entityId: params.id,
      metadata: {
        deletedSession: {
          titleAr: existingSession.titleAr,
          startsAt: existingSession.startsAt.toISOString(),
        },
      },
    });

    logger.info('Session deleted successfully', {
      sessionId: params.id,
      deletedBy: sessionAuth.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/sessions/${params.id}`,
      method: 'DELETE',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
