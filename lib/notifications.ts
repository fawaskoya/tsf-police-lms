import { db } from '@/lib/db';
import logger from '@/lib/logger';

export enum NotificationType {
  COURSE_ENROLLMENT = 'COURSE_ENROLLMENT',
  COURSE_COMPLETION = 'COURSE_COMPLETION',
  EXAM_AVAILABLE = 'EXAM_AVAILABLE',
  EXAM_SUBMITTED = 'EXAM_SUBMITTED',
  EXAM_GRADED = 'EXAM_GRADED',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  SESSION_REMINDER = 'SESSION_REMINDER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  CUSTOM_MESSAGE = 'CUSTOM_MESSAGE',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface NotificationData {
  type: NotificationType;
  recipientId: string;
  senderId?: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  metadata?: any;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export class NotificationService {
  static async createNotification(data: NotificationData) {
    try {
      const notification = await db.notification.create({
        data: {
          type: data.type,
          titleAr: data.titleAr,
          titleEn: data.titleEn,
          messageAr: data.messageAr,
          messageEn: data.messageEn,
          priority: data.priority || NotificationPriority.MEDIUM,
          channels: data.channels || [NotificationChannel.IN_APP],
          recipientId: data.recipientId,
          senderId: data.senderId,
          metadata: data.metadata,
          scheduledAt: data.scheduledAt,
          expiresAt: data.expiresAt,
        },
      });

      logger.info('Notification created successfully', {
        notificationId: notification.id,
        type: notification.type,
        recipientId: notification.recipientId,
      });

      // Trigger immediate sending if not scheduled
      if (!data.scheduledAt) {
        await this.sendNotification(notification.id);
      }

      return notification;
    } catch (error) {
      logger.error('Failed to create notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientId: data.recipientId,
        type: data.type,
      });
      throw error;
    }
  }

  static async sendNotification(notificationId: string) {
    try {
      const notification = await db.notification.findUnique({
        where: { id: notificationId },
        include: {
          recipient: true,
          sender: true,
        },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Send through each channel
      for (const channel of notification.channels) {
        switch (channel) {
          case NotificationChannel.IN_APP:
            // Already stored in database, real-time updates handled by client
            break;
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(notification);
            break;
          case NotificationChannel.SMS:
            await this.sendSMSNotification(notification);
            break;
        }
      }

      logger.info('Notification sent successfully', {
        notificationId,
        channels: notification.channels,
        recipientId: notification.recipientId,
      });
    } catch (error) {
      logger.error('Failed to send notification', {
        notificationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private static async sendEmailNotification(notification: any) {
    // TODO: Implement email sending with service like SendGrid, AWS SES, etc.
    // For now, just log the notification
    logger.info('Email notification would be sent', {
      to: notification.recipient.email,
      subject: notification.recipient.locale === 'ar' ? notification.titleAr : notification.titleEn,
      message: notification.recipient.locale === 'ar' ? notification.messageAr : notification.messageEn,
    });

    // Example implementation:
    /*
    const emailService = new EmailService();
    await emailService.send({
      to: notification.recipient.email,
      subject: notification.recipient.locale === 'ar' ? notification.titleAr : notification.titleEn,
      html: notification.recipient.locale === 'ar' ? notification.messageAr : notification.messageEn,
    });
    */
  }

  private static async sendSMSNotification(notification: any) {
    // TODO: Implement SMS sending with service like Twilio, AWS SNS, etc.
    // For now, just log the notification
    logger.info('SMS notification would be sent', {
      to: notification.recipient.phone,
      message: notification.recipient.locale === 'ar' ? notification.messageAr : notification.messageEn,
    });

    // Example implementation:
    /*
    const smsService = new SMSService();
    await smsService.send({
      to: notification.recipient.phone,
      message: notification.recipient.locale === 'ar' ? notification.messageAr : notification.messageEn,
    });
    */
  }

  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await db.notification.updateMany({
        where: {
          id: notificationId,
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (notification.count > 0) {
        logger.info('Notification marked as read', {
          notificationId,
          userId,
        });
      }

      return notification.count > 0;
    } catch (error) {
      logger.error('Failed to mark notification as read', {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const result = await db.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('All notifications marked as read', {
        userId,
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {}
  ) {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, type } = options;

      const where: any = {
        recipientId: userId,
      };

      if (unreadOnly) {
        where.isRead = false;
      }

      if (type) {
        where.type = type;
      }

      const [notifications, total] = await Promise.all([
        db.notification.findMany({
          where,
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { sentAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.notification.count({ where }),
      ]);

      return {
        notifications,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      logger.error('Failed to get user notifications', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      return await db.notification.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      });
    } catch (error) {
      logger.error('Failed to get unread notification count', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  // Predefined notification templates
  static getNotificationTemplates() {
    return {
      COURSE_ENROLLMENT: {
        titleAr: 'تم تسجيلك في دورة تدريبية',
        titleEn: 'Enrolled in Training Course',
        messageAr: 'تم تسجيلك بنجاح في الدورة: {courseTitle}',
        messageEn: 'You have been successfully enrolled in the course: {courseTitle}',
      },
      COURSE_COMPLETION: {
        titleAr: 'أكملت دورة تدريبية',
        titleEn: 'Course Completed',
        messageAr: 'تهانينا! لقد أكملت الدورة: {courseTitle}',
        messageEn: 'Congratulations! You have completed the course: {courseTitle}',
      },
      EXAM_AVAILABLE: {
        titleAr: 'امتحان متاح',
        titleEn: 'Exam Available',
        messageAr: 'امتحان جديد متاح للدورة: {courseTitle}',
        messageEn: 'A new exam is available for the course: {courseTitle}',
      },
      EXAM_SUBMITTED: {
        titleAr: 'تم تسليم الامتحان',
        titleEn: 'Exam Submitted',
        messageAr: 'تم تسليم امتحانك للدورة: {courseTitle}',
        messageEn: 'Your exam has been submitted for the course: {courseTitle}',
      },
      EXAM_GRADED: {
        titleAr: 'تم تقييم الامتحان',
        titleEn: 'Exam Graded',
        messageAr: 'تم تقييم امتحانك في الدورة: {courseTitle}. الدرجة: {score}%',
        messageEn: 'Your exam has been graded for the course: {courseTitle}. Score: {score}%',
      },
      CERTIFICATE_ISSUED: {
        titleAr: 'شهادة جديدة',
        titleEn: 'New Certificate',
        messageAr: 'تم إصدار شهادة لك في الدورة: {courseTitle}',
        messageEn: 'A certificate has been issued for you in the course: {courseTitle}',
      },
      SESSION_REMINDER: {
        titleAr: 'تذكير بجلسة تدريبية',
        titleEn: 'Session Reminder',
        messageAr: 'تذكير: لديك جلسة تدريبية في {sessionTime} - {courseTitle}',
        messageEn: 'Reminder: You have a training session at {sessionTime} - {courseTitle}',
      },
      SYSTEM_ANNOUNCEMENT: {
        titleAr: 'إعلان نظام',
        titleEn: 'System Announcement',
        messageAr: '{message}',
        messageEn: '{message}',
      },
    };
  }

  static createNotificationFromTemplate(
    templateType: NotificationType,
    recipientId: string,
    variables: Record<string, string>,
    options: Partial<NotificationData> = {}
  ) {
    const templates = this.getNotificationTemplates();
    const template = templates[templateType];

    if (!template) {
      throw new Error(`Notification template not found: ${templateType}`);
    }

    // Replace variables in title and message
    const replaceVariables = (text: string) => {
      return Object.entries(variables).reduce(
        (result, [key, value]) => result.replace(`{${key}}`, value),
        text
      );
    };

    return this.createNotification({
      type: templateType,
      recipientId,
      titleAr: replaceVariables(template.titleAr),
      titleEn: replaceVariables(template.titleEn),
      messageAr: replaceVariables(template.messageAr),
      messageEn: replaceVariables(template.messageEn),
      ...options,
    });
  }
}
