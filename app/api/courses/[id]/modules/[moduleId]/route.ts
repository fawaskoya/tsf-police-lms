import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateModuleSchema = z.object({
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
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    logger.info('Course Module API GET request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
      moduleId: params.moduleId,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if the user has permission to read courses
    if (!hasPermission(session.user.role, 'courses:read')) {
      throw new AuthorizationError('Insufficient permissions to read course modules');
    }

    // Fetch the module
    const moduleData = await db.module.findFirst({
      where: {
        id: params.moduleId,
        courseId: params.id,
      },
    });

    if (!moduleData) {
      throw new NotFoundError('Module not found', { 
        courseId: params.id,
        moduleId: params.moduleId,
      });
    }

    logger.info('Course module fetched successfully', {
      courseId: params.id,
      moduleId: moduleData.id,
    });

    return NextResponse.json({ module: moduleData });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}/modules/${params.moduleId}`,
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    logger.info('Course Module Update API PUT request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
      moduleId: params.moduleId,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if the user has permission to write courses
    if (!hasPermission(session.user.role, 'courses:write')) {
      throw new AuthorizationError('Insufficient permissions to update course modules');
    }

    // Check if the module exists
    const existingModule = await db.module.findFirst({
      where: {
        id: params.moduleId,
        courseId: params.id,
      },
    });

    if (!existingModule) {
      throw new NotFoundError('Module not found', { 
        courseId: params.id,
        moduleId: params.moduleId,
      });
    }

    const body = await request.json();
    
    // Validate the request body
    const validatedData = updateModuleSchema.parse(body);

    // Update the module
    const updatedModule = await db.module.update({
      where: { id: params.moduleId },
      data: {
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

    logger.info('Course module updated successfully', {
      courseId: params.id,
      moduleId: updatedModule.id,
      moduleKind: updatedModule.kind,
    });

    return NextResponse.json({ module: updatedModule });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}/modules/${params.moduleId}`,
      method: 'PUT',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    logger.info('Course Module Deletion API DELETE request initiated', {
      url: request.url,
      method: request.method,
      courseId: params.id,
      moduleId: params.moduleId,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    // Check if the user has permission to write courses
    if (!hasPermission(session.user.role, 'courses:write')) {
      throw new AuthorizationError('Insufficient permissions to delete course modules');
    }

    // Check if the module exists
    const existingModule = await db.module.findFirst({
      where: {
        id: params.moduleId,
        courseId: params.id,
      },
    });

    if (!existingModule) {
      throw new NotFoundError('Module not found', { 
        courseId: params.id,
        moduleId: params.moduleId,
      });
    }

    // Delete the module
    await db.module.delete({
      where: { id: params.moduleId },
    });

    logger.info('Course module deleted successfully', {
      courseId: params.id,
      moduleId: params.moduleId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/courses/${params.id}/modules/${params.moduleId}`,
      method: 'DELETE',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
