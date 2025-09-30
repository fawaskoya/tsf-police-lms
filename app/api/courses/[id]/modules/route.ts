import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createModuleSchema = z.object({
  titleAr: z.string().min(1, 'Arabic title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  kind: z.enum(['VIDEO', 'PDF', 'QUIZ', 'SCORM', 'H5P']),
  uri: z.string().min(1, 'URI is required'),
  durationMins: z.number().min(1, 'Duration must be at least 1 minute'),
  metadata: z.object({
    titleAr: z.string(),
    titleEn: z.string(),
    descriptionAr: z.string().optional(),
    descriptionEn: z.string().optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Course Modules API GET request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if the user has permission to read courses
    if (!hasPermission(session.user.role, 'courses:read')) {
      throw new AuthorizationError('Insufficient permissions to read course modules');
    }

    // Check if the course exists
    const course = await db.course.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundError('Course not found', { courseId: params.id });
    }

    // Fetch modules for the course
    const modules = await db.module.findMany({
      where: { courseId: params.id },
      orderBy: { order: 'asc' },
    });

    logger.info('Course modules fetched successfully', {
      courseId: params.id,
      moduleCount: modules.length,
    });

    return NextResponse.json({ modules });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}/modules`,
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
    logger.info('Course Module Creation API POST request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if the user has permission to write courses
    if (!hasPermission(session.user.role, 'courses:write')) {
      throw new AuthorizationError('Insufficient permissions to create course modules');
    }

    // Check if the course exists
    const course = await db.course.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundError('Course not found', { courseId: params.id });
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = createModuleSchema.parse(body);

    // Get the next order number for this course
    const lastModule = await db.module.findFirst({
      where: { courseId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (lastModule?.order || 0) + 1;

    // Create the module
    const newModule = await db.module.create({
      data: {
        courseId: params.id,
        order: nextOrder,
        kind: validatedData.kind,
        uri: validatedData.uri,
        durationMins: validatedData.durationMins,
        metadata: validatedData.metadata || {
          titleAr: validatedData.titleAr,
          titleEn: validatedData.titleEn,
          descriptionAr: validatedData.descriptionAr,
          descriptionEn: validatedData.descriptionEn,
        },
      },
    });

    logger.info('Course module created successfully', {
      courseId: params.id,
      moduleId: newModule.id,
      moduleKind: newModule.kind,
    });

    return NextResponse.json({ module: newModule }, { status: 201 });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}/modules`,
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}