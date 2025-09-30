import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth-server';
import { z } from 'zod';

const archiveEntitySchema = z.object({
  entityType: z.enum(['course', 'module', 'exam']),
  entityId: z.string(),
  version: z.string(),
  reason: z.string().optional(),
});

// Archive an entity
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can archive entities
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { entityType, entityId, version, reason } = archiveEntitySchema.parse(body);

    // Fetch the entity data based on type
    let entityData;
    switch (entityType) {
      case 'course':
        entityData = await db.course.findUnique({
          where: { id: entityId },
          include: {
            modules: true,
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
        break;
      case 'module':
        entityData = await db.module.findUnique({
          where: { id: entityId },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                titleAr: true,
                titleEn: true,
              },
            },
          },
        });
        break;
      case 'exam':
        entityData = await db.exam.findUnique({
          where: { id: entityId },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                titleAr: true,
                titleEn: true,
              },
            },
            questions: true,
          },
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    if (!entityData) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Create archive record
    const archive = await db.archive.create({
      data: {
        entityType,
        entityId,
        version,
        data: entityData as any,
        reason,
        archivedById: session.user.id,
      },
      include: {
        archiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: archive,
    });
  } catch (error) {
    console.error('Error archiving entity:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to archive entity' },
      { status: 500 }
    );
  }
}

// Get archived entities
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can view archives
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = entityType ? { entityType } : undefined;

    const [archives, total] = await Promise.all([
      db.archive.findMany({
        where,
        include: {
          archiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { archivedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.archive.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: archives,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}
