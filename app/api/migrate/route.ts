import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, AuthorizationError } from '@/lib/errorHandler';
import { execSync } from 'child_process';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    logger.info('Database migration API request initiated', {
      url: request.url,
      method: request.method,
    });

    const session = await getServerSession();

    if (!session) {
      throw new AuthorizationError('Authentication required');
    }

    if (!hasPermission(session.user.role, 'settings:write')) {
      throw new AuthorizationError('Insufficient permissions to run database migrations');
    }

    // Run prisma db push
    try {
      const output = execSync('npx prisma db push --accept-data-loss', {
        encoding: 'utf-8',
        env: { ...process.env },
        timeout: 60000, // 60 seconds timeout
      });

      logger.info('Database migration completed successfully', {
        output: output.substring(0, 500), // Limit log size
      });

      return NextResponse.json({
        success: true,
        message: 'Database migration completed successfully',
        output: output,
      });
    } catch (error) {
      logger.error('Database migration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
      }, { status: 500 });
    }
  } catch (error) {
    const { error: errorResponse, status } = handleApiError(error, {
      endpoint: '/api/migrate',
      method: 'POST',
    });

    return NextResponse.json(errorResponse, { status });
  }
}
