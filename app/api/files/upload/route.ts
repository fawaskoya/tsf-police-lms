import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { FileStorageService } from '@/lib/storage';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const uploadSchema = z.object({
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    logger.info('File upload API request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'files:upload')) {
      throw new AuthorizationError('Insufficient permissions to upload files');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Validate file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await FileStorageService.validateFile(fileBuffer);

    // Parse metadata
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');
    const validatedMetadata = validateInput(uploadSchema, metadata, {
      endpoint: '/api/files/upload',
      method: 'POST',
    });

    // Upload file to storage
    const fileMetadata = await FileStorageService.uploadFile(
      fileBuffer,
      file.name,
      file.type,
      session.user.id
    );

    // Save file record to database
    const fileRecord = await db.fileObject.create({
      data: {
        bucket: fileMetadata.bucket,
        key: fileMetadata.key,
        size: fileMetadata.size,
        checksum: fileMetadata.checksum,
        contentType: fileMetadata.contentType,
        uploaderId: session.user.id,
      },
    });

    // Create audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'UPLOAD',
      entity: 'FileObject',
      entityId: fileRecord.id,
      metadata: {
        originalName: file.name,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        courseId: validatedMetadata.courseId,
        moduleId: validatedMetadata.moduleId,
      },
    });

    logger.info('File uploaded successfully', {
      fileId: fileRecord.id,
      uploaderId: session.user.id,
      size: fileMetadata.size,
      contentType: fileMetadata.contentType,
    });

    return NextResponse.json({
      file: {
        id: fileRecord.id,
        name: file.name,
        size: fileMetadata.size,
        contentType: fileMetadata.contentType,
        url: fileMetadata.url,
        signedUrl: fileMetadata.signedUrl,
        uploadedAt: fileRecord.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/files/upload',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    logger.info('Files list API request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'files:read')) {
      throw new AuthorizationError('Insufficient permissions to view files');
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const uploaderId = searchParams.get('uploaderId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    const where: any = {};

    if (courseId) where.courseId = courseId;
    if (uploaderId) where.uploaderId = uploaderId;

    const [files, total] = await Promise.all([
      db.fileObject.findMany({
        where,
        include: {
          uploader: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.fileObject.count({ where }),
    ]);

    // Generate signed URLs for files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        let url: string;
        let signedUrl: string | undefined;

        try {
          signedUrl = await FileStorageService.generateSignedUrl(file.key);
          url = signedUrl;
        } catch {
          // Fallback to direct URL if signed URL generation fails
          url = file.bucket === 'local' ? `/api/files/${file.id}` : `https://example.com/${file.key}`;
        }

        return {
          id: file.id,
          name: file.key.split('/').pop() || 'Unknown',
          size: file.size,
          contentType: file.contentType,
          url,
          signedUrl,
          uploadedAt: file.createdAt,
          uploader: `${file.uploader.firstName} ${file.uploader.lastName}`,
        };
      })
    );

    logger.info('Files list retrieved successfully', {
      count: files.length,
      total,
      page,
      limit,
    });

    return NextResponse.json({
      files: filesWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/files',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
