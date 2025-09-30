import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from '@/lib/auth-server';
import { z } from 'zod';

const updateBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  fontFamily: z.string().min(1),
  customCss: z.string().optional(),
});

// Get current branding
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branding = await db.branding.findFirst({
      where: { isActive: true },
    });

    // Return default branding if none exists
    const defaultBranding = {
      id: 'default',
      organizationId: 'tsf-police',
      logoUrl: null,
      primaryColor: '#6B0023', // TSF Police red
      secondaryColor: '#FFFFFF', // White
      accentColor: '#F8F9FA', // Light gray
      fontFamily: 'Inter',
      customCss: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: branding || defaultBranding,
    });
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branding' },
      { status: 500 }
    );
  }
}

// Update branding
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admins can update branding
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { logoUrl, primaryColor, secondaryColor, accentColor, fontFamily, customCss } = 
      updateBrandingSchema.parse(body);

    // Deactivate current branding
    await db.branding.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new branding
    const branding = await db.branding.create({
      data: {
        organizationId: 'tsf-police',
        logoUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        customCss,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: branding,
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update branding' },
      { status: 500 }
    );
  }
}
