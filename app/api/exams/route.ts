import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createExamSchema = z.object({
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  courseId: z.string(),
  timeLimitMins: z.number().min(1),
  totalMarks: z.number().min(1),
  randomize: z.boolean().default(false),
  negativeMarking: z.boolean().default(false),
  lockdown: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'exams:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const exams = await db.exam.findMany({
      include: {
        course: {
          select: {
            titleAr: true,
            titleEn: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !hasPermission(session.user.role, 'exams:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createExamSchema.parse(body);

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: validatedData.courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const exam = await db.exam.create({
      data: validatedData,
      include: {
        course: {
          select: {
            titleAr: true,
            titleEn: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'CREATE',
      entity: 'Exam',
      entityId: exam.id,
      metadata: { titleAr: validatedData.titleAr, courseId: validatedData.courseId },
    });

    return NextResponse.json({ exam });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
