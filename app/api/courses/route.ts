import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createCourseSchema = z.object({
  code: z.string().min(1),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  summaryAr: z.string().optional(),
  summaryEn: z.string().optional(),
  modality: z.enum(['ELearning', 'Classroom', 'Blended']),
  durationMins: z.number().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'courses:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const modality = searchParams.get('modality');

    const where: any = {};

    if (status) where.status = status;
    if (modality) where.modality = modality;

    const courses = await db.course.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
            files: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'courses:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    // Check if course code already exists
    const existingCourse = await db.course.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
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

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'CREATE',
      entity: 'Course',
      entityId: course.id,
      metadata: { code: validatedData.code, modality: validatedData.modality },
    });

    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
