import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const updateUserSchema = z.object({
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
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Users API GET single request initiated', {
      url: request.url,
      method: request.method,
      userId: params.id,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'users:read')) {
      throw new AuthorizationError('Insufficient permissions to read users');
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        qid: true,
        badgeNo: true,
        rank: true,
        unit: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        locale: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', { userId: params.id });
    }

    logger.info('User fetched successfully', {
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/users/${params.id}`,
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Users API PUT request initiated', {
      url: request.url,
      method: request.method,
      userId: params.id,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'users:write')) {
      throw new AuthorizationError('Insufficient permissions to update users');
    }

    const body = await request.json();
    const validatedData = validateInput(updateUserSchema, body, {
      endpoint: `/api/users/${params.id}`,
      method: 'PUT',
    });

    logger.debug('Updating user with validated data', {
      userId: params.id,
      email: validatedData.email,
      role: validatedData.role,
    });

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found', { userId: params.id });
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        throw new ValidationError('User with this email already exists', {
          email: validatedData.email,
        });
      }
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: validatedData,
      select: {
        id: true,
        qid: true,
        badgeNo: true,
        rank: true,
        unit: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        locale: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      metadata: {
        role: validatedData.role,
        unit: validatedData.unit,
        email: validatedData.email,
        changes: Object.keys(validatedData),
      },
    });

    logger.info('User updated successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/users/${params.id}`,
      method: 'PUT',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.info('Users API DELETE request initiated', {
      url: request.url,
      method: request.method,
      userId: params.id,
    });

    const session = await getServerSession(authOptions);

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'users:delete')) {
      throw new AuthorizationError('Insufficient permissions to delete users');
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found', { userId: params.id });
    }

    // Prevent deleting yourself
    if (existingUser.id === session.user.id) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Prevent deleting super admin accounts (except by another super admin)
    if (existingUser.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      throw new AuthorizationError('Only super admins can delete other super admins');
    }

    await db.user.delete({
      where: { id: params.id },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: params.id,
      metadata: {
        deletedUser: {
          email: existingUser.email,
          role: existingUser.role,
          name: `${existingUser.firstName} ${existingUser.lastName}`,
        },
      },
    });

    logger.info('User deleted successfully', {
      userId: params.id,
      deletedBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: `/api/users/${params.id}`,
      method: 'DELETE',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
