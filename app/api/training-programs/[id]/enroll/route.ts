import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth-server';
import { z } from 'zod';

const enrollUserSchema = z.object({
  userId: z.string(),
});

// Enroll user in training program
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins, super_admins, and commanders can enroll users
    if (!['admin', 'super_admin', 'commander'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const trainingProgramId = params.id;
    const body = await request.json();
    const { userId } = enrollUserSchema.parse(body);

    // Check if training program exists
    const trainingProgram = await db.trainingProgram.findUnique({
      where: { id: trainingProgramId },
      include: {
        modules: {
          include: {
            course: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!trainingProgram) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.individualEnrollment.findUnique({
      where: {
        userId_trainingProgramId: {
          userId,
          trainingProgramId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'User already enrolled' }, { status: 400 });
    }

    // Create individual enrollment
    const enrollment = await db.individualEnrollment.create({
      data: {
        userId,
        trainingProgramId,
        status: 'ASSIGNED',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            badgeNo: true,
            rank: true,
            unit: true,
          },
        },
        trainingProgram: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Create regular course enrollments for each course in the program
    const courseEnrollments = await Promise.all(
      trainingProgram.modules.map(module =>
        db.enrollment.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: module.course.id,
            },
          },
          update: {
            status: 'ASSIGNED',
          },
          create: {
            userId,
            courseId: module.course.id,
            status: 'ASSIGNED',
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        enrollment,
        courseEnrollments,
      },
    });
  } catch (error) {
    console.error('Error enrolling user in training program:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to enroll user in training program' },
      { status: 500 }
    );
  }
}

// Get training program enrollments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trainingProgramId = params.id;

    // Check if training program exists
    const trainingProgram = await db.trainingProgram.findUnique({
      where: { id: trainingProgramId },
    });

    if (!trainingProgram) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    const enrollments = await db.individualEnrollment.findMany({
      where: { trainingProgramId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            badgeNo: true,
            rank: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    console.error('Error fetching training program enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training program enrollments' },
      { status: 500 }
    );
  }
}
