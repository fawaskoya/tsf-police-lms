import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth-server';
import { z } from 'zod';

const createModuleVersionSchema = z.object({
  version: z.string().min(1),
  uri: z.string().min(1),
  metadata: z.any().optional(),
  changeLog: z.string().optional(),
});

// Create a new module version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;
    const body = await request.json();
    const { version, uri, metadata, changeLog } = createModuleVersionSchema.parse(body);

    // Check if module exists
    const moduleRecord = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleRecord) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Check permissions (only instructors, admins, super_admins can create versions)
    if (!['instructor', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Create new version
    const moduleVersion = await db.moduleVersion.create({
      data: {
        moduleId,
        version,
        uri,
        metadata,
        changeLog,
        createdById: session.user.id,
      },
      include: {
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

    return NextResponse.json({
      success: true,
      data: moduleVersion,
    });
  } catch (error) {
    console.error('Error creating module version:', error);
    return NextResponse.json(
      { error: 'Failed to create module version' },
      { status: 500 }
    );
  }
}

// Get all versions for a module
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const moduleId = params.id;

    // Check if module exists
    const moduleRecord = await db.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleRecord) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const versions = await db.moduleVersion.findMany({
      where: { moduleId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('Error fetching module versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module versions' },
      { status: 500 }
    );
  }
}
