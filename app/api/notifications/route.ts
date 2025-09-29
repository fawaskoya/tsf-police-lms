import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { NotificationService, NotificationType, NotificationChannel, NotificationPriority } from '@/lib/notifications';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const createNotificationSchema = z.object({
  type: z.enum([
    'COURSE_ENROLLMENT',
    'COURSE_COMPLETION',
    'EXAM_AVAILABLE',
    'EXAM_SUBMITTED',
    'EXAM_GRADED',
    'CERTIFICATE_ISSUED',
    'SESSION_REMINDER',
    'SYSTEM_ANNOUNCEMENT',
    'CUSTOM_MESSAGE',
  ]),
  recipientId: z.string(),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
  messageAr: z.string().min(1),
  messageEn: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'SMS'])).default(['IN_APP']),
  metadata: z.record(z.any()).optional(),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    logger.info('Notifications API GET request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'notifications:read')) {
      throw new AuthorizationError('Insufficient permissions to read notifications');
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') as NotificationType | undefined;

    const result = await NotificationService.getUserNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly,
      type,
    });

    logger.info('Notifications fetched successfully', {
      userId: session.user.id,
      count: result.notifications.length,
      total: result.total,
    });

    return NextResponse.json(result);
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/notifications',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Notifications API POST request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'notifications:write')) {
      throw new AuthorizationError('Insufficient permissions to create notifications');
    }

    const body = await request.json();
    const validatedData = validateInput(createNotificationSchema, body, {
      endpoint: '/api/notifications',
      method: 'POST',
    });

    const notificationData = {
      ...validatedData,
      type: validatedData.type as NotificationType,
      priority: validatedData.priority as NotificationPriority,
      channels: validatedData.channels as NotificationChannel[],
      senderId: session.user.id,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
    };

    const notification = await NotificationService.createNotification(notificationData);

    logger.info('Notification created successfully', {
      notificationId: notification.id,
      senderId: session.user.id,
      recipientId: notification.recipientId,
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/notifications',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
