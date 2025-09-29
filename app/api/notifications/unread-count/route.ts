import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { NotificationService } from '@/lib/notifications';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError } from '@/lib/errorHandler';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'notifications:read')) {
      throw new AuthorizationError('Insufficient permissions to read notifications');
    }

    const count = await NotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({ count });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/notifications/unread-count',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
