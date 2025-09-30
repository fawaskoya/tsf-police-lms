import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { storageService } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  console.log('🚀 FILE PREVIEW API CALLED:', { key: params.key, url: request.url });
  try {
    const session = await getServerSession();
    console.log('Preview session info:', session ? { userId: session.user?.id, role: session.user?.role } : 'No session');
    
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
      console.log('File not found in database for preview key:', fileKey);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access permissions (same as download)
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

    // Get file from storage
    console.log('Attempting to preview file from storage:', fileRecord.key);
    const downloadResult = await storageService.downloadFile(fileRecord.key);

    if (!downloadResult.success) {
      console.error('Storage preview failed:', downloadResult.error);
      return NextResponse.json(
        { error: `Preview failed: ${downloadResult.error}` },
        { status: 500 }
      );
    }

    if (!downloadResult.buffer) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Return file with appropriate headers for preview
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.contentType);
    headers.set('Content-Length', fileRecord.size.toString());
    headers.set('Content-Disposition', `inline; filename="${fileRecord.filename}"`);
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // For PDFs, add specific headers for browser preview
    if (fileRecord.contentType === 'application/pdf') {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    return new NextResponse(downloadResult.buffer as any, { headers });
  } catch (error) {
    console.error('File preview error:', error);
    return NextResponse.json(
      { error: 'Preview failed' },
      { status: 500 }
    );
  }
}
