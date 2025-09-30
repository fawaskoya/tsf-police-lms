import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { storageService } from '@/lib/storage';

// Download or access a file
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession();
    const fileKey = params.key;

    // Find file record
    const fileRecord = await db.fileObject.findFirst({
      where: {
        OR: [
          { key: fileKey },
          { key: { contains: fileKey } },
        ],
      },
      include: {
        course: true,
        module: true,
      },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions
    if (!fileRecord.isPublic) {
      if (!session?.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Check if user has access to the course/module
      if (fileRecord.courseId) {
        const hasAccess = await db.enrollment.findFirst({
          where: {
            userId: session.user.id,
            courseId: fileRecord.courseId,
            status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] },
          },
        });

        if (!hasAccess && !['admin', 'super_admin'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }

      // Check if user is the uploader or admin
      if (
        fileRecord.uploaderId !== session.user.id &&
        !['admin', 'super_admin'].includes(session.user.role)
      ) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Download file from storage
    const downloadResult = await storageService.downloadFile(fileRecord.key);

    if (!downloadResult.success) {
      return NextResponse.json(
        { error: `Download failed: ${downloadResult.error}` },
        { status: 500 }
      );
    }

    // Update download count
    await db.fileObject.update({
      where: { id: fileRecord.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Return file with appropriate headers
    if (!downloadResult.buffer) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    return new NextResponse(downloadResult.buffer, {
      headers: {
        'Content-Type': fileRecord.contentType,
        'Content-Length': fileRecord.size.toString(),
        'Content-Disposition': `inline; filename="${fileRecord.filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}

// Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileKey = params.key;

    // Find file record
    const fileRecord = await db.fileObject.findFirst({
      where: {
        OR: [
          { key: fileKey },
          { key: { contains: fileKey } },
        ],
      },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check permissions (only uploader or admin can delete)
    if (
      fileRecord.uploaderId !== session.user.id &&
      !['admin', 'super_admin'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete from storage
    const deleted = await storageService.deleteFile(fileRecord.key);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete file from storage' }, { status: 500 });
    }

    // Update database record
    await db.fileObject.update({
      where: { id: fileRecord.id },
      data: { status: 'DELETED' },
    });

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('File delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
