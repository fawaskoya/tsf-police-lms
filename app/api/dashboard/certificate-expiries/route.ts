import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !hasPermission(session.user.role, 'reports:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();
    
    // Calculate date ranges
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysFromNow = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    const ninetyDaysFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    // Get certificates expiring in different timeframes
    const [
      expiringIn30Days,
      expiringIn60Days,
      expiringIn90Days
    ] = await Promise.all([
      // Certificates expiring in next 30 days
      db.certificate.count({
        where: {
          expiresAt: {
            gte: now,
            lte: thirtyDaysFromNow
          }
        }
      }),
      
      // Certificates expiring in next 60 days (excluding 30 days)
      db.certificate.count({
        where: {
          expiresAt: {
            gt: thirtyDaysFromNow,
            lte: sixtyDaysFromNow
          }
        }
      }),
      
      // Certificates expiring in next 90 days (excluding 60 days)
      db.certificate.count({
        where: {
          expiresAt: {
            gt: sixtyDaysFromNow,
            lte: ninetyDaysFromNow
          }
        }
      })
    ]);

    // Get detailed expiry information
    const expiryDetails = await db.certificate.findMany({
      where: {
        expiresAt: {
          gte: now,
          lte: ninetyDaysFromNow
        }
      },
      select: {
        id: true,
        serial: true,
        expiresAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            unit: true
          }
        },
        course: {
          select: {
            titleEn: true,
            titleAr: true
          }
        }
      },
      orderBy: {
        expiresAt: 'asc'
      }
    });

    return NextResponse.json({
      expiringIn30Days,
      expiringIn60Days,
      expiringIn90Days,
      expiryDetails
    });
  } catch (error) {
    console.error('Error fetching certificate expiries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
