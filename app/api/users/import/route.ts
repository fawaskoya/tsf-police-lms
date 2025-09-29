import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';
import bcrypt from 'bcryptjs';

const userImportSchema = z.object({
  qid: z.string().optional(),
  badgeNo: z.string().optional(),
  rank: z.string().optional(),
  unit: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'COMMANDER', 'TRAINEE']),
  locale: z.string().default('ar'),
});

const bulkImportSchema = z.array(userImportSchema);

export async function POST(request: NextRequest) {
  try {
    logger.info('Users bulk import API request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'users:write')) {
      throw new AuthorizationError('Insufficient permissions to import users');
    }

    const body = await request.json();
    const users = validateInput(bulkImportSchema, body, {
      endpoint: '/api/users/import',
      method: 'POST',
    });

    if (users.length === 0) {
      throw new ValidationError('No users provided for import');
    }

    if (users.length > 100) {
      throw new ValidationError('Cannot import more than 100 users at once');
    }

    logger.debug('Processing bulk user import', {
      count: users.length,
    });

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; email: string; error: string }>,
      created: [] as Array<{ id: string; email: string; name: string }>,
    };

    // Check for duplicate emails in the import data
    const emails = users.map(u => u.email.toLowerCase());
    const uniqueEmails = new Set(emails);

    if (emails.length !== uniqueEmails.size) {
      throw new ValidationError('Duplicate emails found in import data');
    }

    // Check for existing users
    const existingUsers = await db.user.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    });

    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const rowNumber = i + 1;

      try {
        // Check if email already exists
        if (existingEmails.has(userData.email.toLowerCase())) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email: userData.email,
            error: 'Email already exists',
          });
          continue;
        }

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const user = await db.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        results.successful++;
        results.created.push({
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        });

        // Audit log for each created user
        await createAuditLog({
          actorId: session.user.id,
          action: 'CREATE',
          entity: 'User',
          entityId: user.id,
          metadata: {
            role: userData.role,
            unit: userData.unit,
            email: userData.email,
            imported: true,
          },
        });

      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: userData.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        logger.error('Failed to create user during import', {
          email: userData.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Audit log for the import operation
    await createAuditLog({
      actorId: session.user.id,
      action: 'IMPORT',
      entity: 'User',
      entityId: undefined,
      metadata: {
        total: users.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors.length,
      },
    });

    logger.info('Bulk user import completed', {
      total: users.length,
      successful: results.successful,
      failed: results.failed,
    });

    return NextResponse.json({
      success: results.successful > 0,
      results,
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/users/import',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
