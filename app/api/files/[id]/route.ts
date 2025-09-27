import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { FileStorageService } from '@/lib/storage';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError, NotFoundError } from '@/lib/errorHandler';
import path from 'path';
import fs from 'fs/promises';
import logger from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('File access API request initiated', {
      url: request.url,
      method: request.method,
      fileId: params.id,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'files:read')) {
      throw new AuthorizationError('Insufficient permissions to access files');
    }

    // Get file record from database
    const fileRecord = await db.fileObject.findUnique({
      where: { id: params.id },
    });

    if (!fileRecord) {
      throw new NotFoundError('File not found', { fileId: params.id });
    }

    let fileBuffer: Buffer;

    if (process.env.NODE_ENV === 'production') {
      // Get file from Cloudflare R2
      const stream = await FileStorageService.getFileStream(fileRecord.key);
      // Convert stream to buffer for NextResponse
      const chunks: Uint8Array[] = [];
      if (stream) {
        for await (const chunk of stream as any) {
          chunks.push(chunk);
        }
        fileBuffer = Buffer.concat(chunks);
      } else {
        throw new Error('File stream is empty');
      }
    } else {
      // Get file from local filesystem
      const filePath = path.join(process.cwd(), fileRecord.key);
      fileBuffer = await fs.readFile(filePath);
    }

    logger.info('File served successfully', {
      fileId: params.id,
      userId: session.user.id,
      size: fileRecord.size,
      contentType: fileRecord.contentType,
    });

    // Return file with appropriate headers
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': fileRecord.contentType,
        'Content-Length': fileRecord.size.toString(),
        'Content-Disposition': `attachment; filename="${fileRecord.key.split('/').pop()}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/files/${params.id}`,
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('File delete API request initiated', {
      url: request.url,
      method: request.method,
      fileId: params.id,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'files:delete')) {
      throw new AuthorizationError('Insufficient permissions to delete files');
    }

    // Get file record from database
    const fileRecord = await db.fileObject.findUnique({
      where: { id: params.id },
    });

    if (!fileRecord) {
      throw new NotFoundError('File not found', { fileId: params.id });
    }

    // Check if user is the uploader or has admin permissions
    if (fileRecord.uploaderId !== session.user.id && !hasPermission(session.user.role, 'files:delete')) {
      throw new AuthorizationError('Only file uploader or admin can delete files');
    }

    // Delete from storage
    await FileStorageService.deleteFile(fileRecord.key);

    // Delete from database
    await db.fileObject.delete({
      where: { id: params.id },
    });

    logger.info('File deleted successfully', {
      fileId: params.id,
      deletedBy: session.user.id,
      key: fileRecord.key,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/files/${params.id}`,
      method: 'DELETE',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
