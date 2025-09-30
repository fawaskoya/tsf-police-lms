import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const issueCertificateSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  examId: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'certificates:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const where: any = {};
    
    // If user is trainee, only show their own certificates
    if (session.user.role === 'trainee') {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    const certificates = await db.certificate.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            unit: true,
            rank: true,
          },
        },
        course: {
          select: {
            code: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'certificates:write')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = issueCertificateSchema.parse(body);

    // Verify the enrollment is completed
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: validatedData.userId,
          courseId: validatedData.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'User is not enrolled in this course' },
        { status: 404 }
      );
    }

    if (enrollment.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Course must be completed before issuing certificate' },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCert = await db.certificate.findFirst({
      where: {
        userId: validatedData.userId,
        courseId: validatedData.courseId,
      },
    });

    if (existingCert) {
      return NextResponse.json(
        { error: 'Certificate already issued for this course' },
        { status: 400 }
      );
    }

    // Generate serial number and QR code
    const serialNumber = `TSF-${Date.now()}-${validatedData.userId.slice(-6)}`;
    const qrCode = `https://verify.tsf.qa/cert/${serialNumber}`;

    // Calculate expiry date (default 2 years from now)
    const expiresAt = validatedData.expiresAt 
      ? new Date(validatedData.expiresAt)
      : new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

    // Issue certificate
    const certificate = await db.certificate.create({
      data: {
        userId: validatedData.userId,
        courseId: validatedData.courseId,
        issuedAt: new Date(),
        expiresAt,
        serial: serialNumber,
        qrCode,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            unit: true,
            rank: true,
          },
        },
        course: {
          select: {
            code: true,
            titleAr: true,
            titleEn: true,
          },
        },
      },
    });

    console.log('✅ Certificate issued:', {
      serialNumber,
      user: certificate.user.email,
      course: certificate.course.code,
    });

    return NextResponse.json({ certificate });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error issuing certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
