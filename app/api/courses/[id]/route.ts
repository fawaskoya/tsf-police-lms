import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const updateCourseSchema = z.object({
  code: z.string().min(1),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  summaryAr: z.string().optional(),
  summaryEn: z.string().optional(),
  modality: z.enum(['ELearning', 'Classroom', 'Blended']),
  durationMins: z.number().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Courses API GET single request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'courses:read')) {
      throw new AuthorizationError('Insufficient permissions to read courses');
    }

    const course = await db.course.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found', { courseId: params.id });
    }

    logger.info('Course fetched successfully', {
      courseId: course.id,
      titleAr: course.titleAr,
    });

    return NextResponse.json({ course });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}`,
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
    logger.info('Courses API PUT request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'courses:write')) {
      throw new AuthorizationError('Insufficient permissions to update courses');
    }

    const body = await request.json();
    const validatedData = validateInput(updateCourseSchema, body, {
      endpoint: `/api/courses/${params.id}`,
      method: 'PUT',
    });

    logger.debug('Updating course with validated data', {
      courseId: params.id,
      titleAr: validatedData.titleAr,
      status: validatedData.status,
    });

    // Check if course exists
    const existingCourse = await db.course.findUnique({
      where: { id: params.id },
    });

    if (!existingCourse) {
      throw new NotFoundError('Course not found', { courseId: params.id });
    }

    // Check if code is being changed and if it already exists
    if (validatedData.code !== existingCourse.code) {
      const codeExists = await db.course.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        throw new ValidationError('Course with this code already exists', {
          code: validatedData.code,
        });
      }
    }

    const course = await db.course.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        version: existingCourse.version, // Keep existing version, or increment if needed
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'UPDATE',
      entity: 'Course',
      entityId: course.id,
      metadata: {
        titleAr: validatedData.titleAr,
        titleEn: validatedData.titleEn,
        status: validatedData.status,
        changes: Object.keys(validatedData),
      },
    });

    logger.info('Course updated successfully', {
      courseId: course.id,
      titleAr: course.titleAr,
      status: course.status,
    });

    return NextResponse.json({ course });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}`,
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
    logger.info('Courses API DELETE request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'courses:delete')) {
      throw new AuthorizationError('Insufficient permissions to delete courses');
    }

    // Check if course exists
    const existingCourse = await db.course.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titleAr: true,
        status: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existingCourse) {
      throw new NotFoundError('Course not found', { courseId: params.id });
    }

    // Prevent deleting courses with active enrollments
    if (existingCourse._count.enrollments > 0) {
      throw new ValidationError('Cannot delete course with active enrollments');
    }

    await db.course.delete({
      where: { id: params.id },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'DELETE',
      entity: 'Course',
      entityId: params.id,
      metadata: {
        deletedCourse: {
          titleAr: existingCourse.titleAr,
          status: existingCourse.status,
        },
      },
    });

    logger.info('Course deleted successfully', {
      courseId: params.id,
      deletedBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}`,
      method: 'DELETE',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
