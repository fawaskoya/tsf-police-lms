import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth-server';
import { z } from 'zod';

const createTrainingProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  courseIds: z.array(z.string()),
});

// Create a new training program
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can create training programs
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, courseIds } = createTrainingProgramSchema.parse(body);

    // Verify all courses exist
    const courses = await db.course.findMany({
      where: { id: { in: courseIds } },
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json({ error: 'Some courses not found' }, { status: 400 });
    }

    // Create training program with modules
    const trainingProgram = await db.trainingProgram.create({
      data: {
        name,
        description,
        modules: {
          create: courseIds.map((courseId, index) => ({
            courseId,
            order: index + 1,
            isRequired: true,
          })),
        },
      },
      include: {
        modules: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                titleAr: true,
                titleEn: true,
                durationMins: true,
                modality: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: trainingProgram,
    });
  } catch (error) {
    console.error('Error creating training program:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create training program' },
      { status: 500 }
    );
  }
}

// Get all training programs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [trainingPrograms, total] = await Promise.all([
      db.trainingProgram.findMany({
        where: { isActive: true },
        include: {
          modules: {
            include: {
              course: {
                select: {
                  id: true,
                  code: true,
                  titleAr: true,
                  titleEn: true,
                  durationMins: true,
                  modality: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.trainingProgram.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: trainingPrograms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training programs' },
      { status: 500 }
    );
  }
}
