import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  fileType: z.string().optional(),
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

// Get files with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Only show files user has access to
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      where.OR = [
        { uploaderId: session.user.id },
        { isPublic: true },
        {
          course: {
            enrollments: {
              some: {
                userId: session.user.id,
                status: { in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] },
              },
            },
          },
        },
      ];
    }

    if (query.fileType) {
      where.fileType = query.fileType;
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    if (query.moduleId) {
      where.moduleId = query.moduleId;
    }

    if (query.search) {
      where.filename = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    // Exclude deleted files
    where.status = { not: 'DELETED' };

    const [files, total] = await Promise.all([
      db.fileObject.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.fileObject.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Files fetch error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// Bulk operations on files
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileIds } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs required' }, { status: 400 });
    }

    // Check permissions for each file
    const files = await db.fileObject.findMany({
      where: {
        id: { in: fileIds },
      },
    });

    const unauthorizedFiles = files.filter(
      file =>
        file.uploaderId !== session.user.id &&
        !['admin', 'super_admin'].includes(session.user.role)
    );

    if (unauthorizedFiles.length > 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some files' },
        { status: 403 }
      );
    }

    // Update files to deleted status
    await db.fileObject.updateMany({
      where: {
        id: { in: fileIds },
      },
      data: {
        status: 'DELETED',
      },
    });

    return NextResponse.json({
      success: true,
      message: `${fileIds.length} files deleted successfully`,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}
