import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const createSessionSchema = z.object({
  courseId: z.string(),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  room: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  instructorId: z.string(),
  capacity: z.number().min(1),
  mode: z.enum(['CLASSROOM', 'FIELD']),
  attendancePolicy: z.object({
    allowLateCheckin: z.boolean().default(false),
    lateCheckinMinutes: z.number().default(15),
    autoMarkAbsent: z.boolean().default(false),
    qrRequired: z.boolean().default(false),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    logger.info('Sessions API GET request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'sessions:read')) {
      throw new AuthorizationError('Insufficient permissions to read sessions');
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const instructorId = searchParams.get('instructorId');
    const status = searchParams.get('status'); // upcoming, completed, ongoing
    const mode = searchParams.get('mode');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const now = new Date();
    const where: any = {};

    if (courseId) where.courseId = courseId;
    if (instructorId) where.instructorId = instructorId;
    if (mode) where.mode = mode;

    if (status === 'upcoming') {
      where.startsAt = { gte: now };
    } else if (status === 'completed') {
      where.endsAt = { lt: now };
    } else if (status === 'ongoing') {
      where.startsAt = { lte: now };
      where.endsAt = { gte: now };
    }

    const [sessions, total] = await Promise.all([
      db.session.findMany({
        where,
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
          _count: {
            select: {
              attendance: true,
            },
          },
        },
        orderBy: { startsAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.session.count({ where }),
    ]);

    logger.info('Sessions fetched successfully', {
      count: sessions.length,
      total,
      page,
      limit,
    });

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/sessions',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Sessions API POST request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'sessions:write')) {
      throw new AuthorizationError('Insufficient permissions to create sessions');
    }

    const body = await request.json();
    const validatedData = validateInput(createSessionSchema, body, {
      endpoint: '/api/sessions',
      method: 'POST',
    });

    // Validate that the course exists
    const course = await db.course.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found', { courseId: validatedData.courseId });
    }

    // Validate that the instructor exists and has the right role
    const instructor = await db.user.findUnique({
      where: { id: validatedData.instructorId },
    });

    if (!instructor || instructor.role !== 'INSTRUCTOR') {
      throw new ValidationError('Invalid instructor', { instructorId: validatedData.instructorId });
    }

    // Validate time range
    const startsAt = new Date(validatedData.startsAt);
    const endsAt = new Date(validatedData.endsAt);

    if (startsAt >= endsAt) {
      throw new ValidationError('Session end time must be after start time');
    }

    if (startsAt < new Date()) {
      throw new ValidationError('Session start time cannot be in the past');
    }

    const newSession = await db.session.create({
      data: {
        ...validatedData,
        startsAt,
        endsAt,
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
      actorId: session.user.id,
      action: 'CREATE',
      entity: 'Session',
      entityId: newSession.id,
      metadata: {
        courseId: validatedData.courseId,
        instructorId: validatedData.instructorId,
        startsAt: startsAt.toISOString(),
        mode: validatedData.mode,
      },
    });

    logger.info('Session created successfully', {
      sessionId: newSession.id,
      courseId: validatedData.courseId,
      instructorId: validatedData.instructorId,
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/sessions',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
