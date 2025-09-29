import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { NotificationService } from '@/lib/notifications';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError } from '@/lib/errorHandler';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('Mark all notifications as read request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'notifications:read')) {
      throw new AuthorizationError('Insufficient permissions to update notifications');
    }

    const count = await NotificationService.markAllAsRead(session.user.id);

    logger.info('All notifications marked as read', {
      userId: session.user.id,
      count,
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/notifications/mark-all-read',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
