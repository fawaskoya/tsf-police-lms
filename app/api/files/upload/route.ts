import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { storageService } from '@/lib/storage';
import {
  validateFile,
  generateFileKey,
  calculateChecksum,
  processVideoFile,
  processAudioFile,
  processImageFile,
  sanitizeFilename,
  type SupportedFileType,
} from '@/lib/fileUpload';
import { z } from 'zod';

const uploadSchema = z.object({
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  isPublic: z.boolean().default(false),
});

// Handle file upload
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!['instructor', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadata = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse metadata
    let uploadMetadata;
    try {
      uploadMetadata = metadata ? JSON.parse(metadata) : {};
    } catch {
      uploadMetadata = {};
    }

    const { courseId, moduleId, isPublic } = uploadSchema.parse(uploadMetadata);

    // Validate file
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateFile(file.name, file.type, buffer.length);

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate file key and checksum
    const sanitizedName = sanitizeFilename(file.name);
    const key = generateFileKey(sanitizedName, session.user.id, courseId, moduleId);
    const checksum = calculateChecksum(buffer);

    // Check if file already exists (by checksum)
    const existingFile = await db.fileObject.findFirst({
      where: { checksum },
    });

    if (existingFile) {
      return NextResponse.json({
        success: true,
        data: {
          ...existingFile,
          isDuplicate: true,
        },
      });
    }

    // Upload file to storage
    const uploadResult = await storageService.uploadFile(key, buffer, file.type);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    // Process file metadata based on type
    let processedMetadata: any = {};
    try {
      if (validation.fileType === 'MP4') {
        processedMetadata = await processVideoFile(buffer);
      } else if (validation.fileType === 'MP3') {
        processedMetadata = await processAudioFile(buffer);
      } else if (validation.fileType === 'IMAGE') {
        processedMetadata = await processImageFile(buffer);
      }
    } catch (error) {
      console.warn('Metadata processing failed:', error);
    }

    // Create database record
    const fileRecord = await db.fileObject.create({
      data: {
        filename: sanitizedName,
        bucket: process.env.STORAGE_BUCKET || 'local',
        key,
        size: buffer.length,
        checksum,
        contentType: file.type,
        fileType: validation.fileType!,
        status: 'UPLOADED',
        metadata: processedMetadata,
        uploaderId: session.user.id,
        courseId,
        moduleId,
        isPublic,
      },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            titleAr: true,
            titleEn: true,
          },
        },
        module: {
          select: {
            id: true,
            order: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: fileRecord,
    });
  } catch (error) {
    console.error('File upload error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid metadata', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Get upload progress (for future chunked uploads)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    if (!uploadId) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
    }

    // This would implement upload progress tracking
    // For now, return basic status
    return NextResponse.json({
      success: true,
      data: {
        uploadId,
        status: 'completed',
        progress: 100,
      },
    });
  } catch (error) {
    console.error('Upload progress error:', error);
    return NextResponse.json(
      { error: 'Failed to get upload progress' },
      { status: 500 }
    );
  }
}