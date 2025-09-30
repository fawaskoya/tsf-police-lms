import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth-server';
import { z } from 'zod';

const updateCourseTagsSchema = z.object({
  tagIds: z.array(z.string()),
});

// Update course tags
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;
    const body = await request.json();
    const { tagIds } = updateCourseTagsSchema.parse(body);

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check permissions (only instructors, admins, super_admins can update tags)
    if (!['instructor', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify all tags exist
    const existingTags = await db.tag.findMany({
      where: { id: { in: tagIds } },
    });

    if (existingTags.length !== tagIds.length) {
      return NextResponse.json({ error: 'Some tags not found' }, { status: 400 });
    }

    // Remove existing tags
    await db.courseTag.deleteMany({
      where: { courseId },
    });

    // Add new tags
    if (tagIds.length > 0) {
      await db.courseTag.createMany({
        data: tagIds.map(tagId => ({
          courseId,
          tagId,
        })),
      });
    }

    // Fetch updated course with tags
    const updatedCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    console.error('Error updating course tags:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update course tags' },
      { status: 500 }
    );
  }
}

// Get course tags
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.id;

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseTags = await db.courseTag.findMany({
      where: { courseId },
      include: {
        tag: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: courseTags.map(ct => ct.tag),
    });
  } catch (error) {
    console.error('Error fetching course tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course tags' },
      { status: 500 }
    );
  }
}
