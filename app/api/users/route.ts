import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, validateInput, AuthorizationError, NotFoundError, ValidationError } from '@/lib/errorHandler';
import { z } from 'zod';
import logger from '@/lib/logger';

const createUserSchema = z.object({
  qid: z.string().optional(),
  badgeNo: z.string().optional(),
  rank: z.string().optional(),
  unit: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'INSTRUCTOR', 'COMMANDER', 'TRAINEE', 'super_admin', 'admin', 'instructor', 'commander', 'trainee']),
  locale: z.string().default('ar'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    logger.info('Users API GET request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'users:read')) {
      throw new AuthorizationError('Insufficient permissions to read users');
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const role = searchParams.get('role');
    const unit = searchParams.get('unit');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (role) where.role = role;
    if (unit) where.unit = unit;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { badgeNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    logger.debug('Fetching users from database', { where, page, limit });

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
        },
      }),
      db.user.count({ where }),
    ]);

    logger.info('Users fetched successfully', {
      count: users.length,
      total,
      page,
      limit,
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/users',
      method: 'GET',
    });

    return NextResponse.json(errorResponse, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Users API POST request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'users:write')) {
      throw new AuthorizationError('Insufficient permissions to create users');
    }

    const body = await request.json();
    const validatedData = validateInput(createUserSchema, body, {
      endpoint: '/api/users',
      method: 'POST',
    });

    logger.debug('Creating user with validated data', {
      email: validatedData.email,
      role: validatedData.role,
      unit: validatedData.unit,
    });

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists', {
        email: validatedData.email,
      });
    }

    // Hash the provided password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Normalize role to lowercase with underscore
    const normalizedRole = validatedData.role.toLowerCase() as any;

    const user = await db.user.create({
      data: {
        ...validatedData,
        role: normalizedRole,
        password: hashedPassword,
        status: validatedData.status || 'ACTIVE',
      },
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
      },
    });

    // Audit log
    await createAuditLog({
      actorId: session.user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      metadata: {
        role: validatedData.role,
        unit: validatedData.unit,
        email: validatedData.email,
      },
    });

    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // TODO: Send welcome email with temporary password
    // For now, return temp password for demo purposes

    return NextResponse.json({
      user,
      message: 'User created successfully.',
    });
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/users',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
