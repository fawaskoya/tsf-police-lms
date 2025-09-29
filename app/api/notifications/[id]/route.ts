import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { NotificationService } from '@/lib/notifications';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError, NotFoundError } from '@/lib/errorHandler';
import logger from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Notification PATCH request initiated', {
      url: request.url,
      method: request.method,
      notificationId: params.id,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'notifications:read')) {
      throw new AuthorizationError('Insufficient permissions to update notifications');
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'mark_read') {
      const success = await NotificationService.markAsRead(params.id, session.user.id);

      if (!success) {
        throw new NotFoundError('Notification not found or already read', { notificationId: params.id });
      }

      logger.info('Notification marked as read', {
        notificationId: params.id,
        userId: session.user.id,
      });

      return NextResponse.json({ success: true });
    }

    // Default action or invalid action
    throw new AuthorizationError('Invalid action');
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/notifications/${params.id}`,
      method: 'PATCH',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
