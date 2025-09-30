// Comprehensive Error Handler for TSF Police LMS
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  errorContext?: any;
  timestamp?: string;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  isOperational = true;
  errorContext: any;
  timestamp: string;

  constructor(message: string, context?: any) {
    super(message);
    this.name = 'ValidationError';
    this.errorContext = context;
    this.timestamp = new Date().toISOString();
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  isOperational = true;
  timestamp: string;

  constructor(message: string, context?: any) {
    super(message);
    this.name = 'AuthorizationError';
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND_ERROR';
  isOperational = true;
  timestamp: string;

  constructor(message: string, context?: any) {
    super(message);
    this.name = 'NotFoundError';
    this.timestamp = new Date().toISOString();
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  code = 'DATABASE_ERROR';
  isOperational = true;
  timestamp: string;

  constructor(message: string, context?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.timestamp = new Date().toISOString();
  }
}

// Error logging function
export function logError(error: AppError | Error, context?: any) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp,
    ...(error instanceof ValidationError && { code: error.code }),
    ...(error instanceof AuthorizationError && { code: error.code }),
    ...(error instanceof NotFoundError && { code: error.code }),
    ...(error instanceof DatabaseError && { code: error.code }),
    ...context,
  };

  // Log to console with structured format
  console.error(`[${timestamp}] ERROR: ${error.name}`, {
    message: error.message,
    code: (error as AppError).code || 'UNKNOWN_ERROR',
    stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
    context,
  });

  // Log to file (if in production)
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send to external logging service
    // For now, we'll use console.error which can be captured by logging services
    console.error('PRODUCTION_ERROR_LOG:', JSON.stringify(errorInfo));
  }

  return errorInfo;
}

// Global error handler for API routes
export function handleApiError(
  error: unknown,
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
  }
): { error: NextResponse; status: number } {
  console.log('🔍 Handling API error:', error);

  // Log the error
  const errorInfo = logError(error as Error, context);

  // Handle different error types
  if (error instanceof ValidationError) {
    return {
      error: NextResponse.json(
        {
          message: error.message,
          code: error.code,
          details: error.errorContext,
          timestamp: error.timestamp,
        },
        { status: error.statusCode }
      ),
      status: error.statusCode,
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      error: NextResponse.json(
        {
          message: error.message,
          code: error.code,
          timestamp: error.timestamp,
        },
        { status: error.statusCode }
      ),
      status: error.statusCode,
    };
  }

  if (error instanceof NotFoundError) {
    return {
      error: NextResponse.json(
        {
          message: error.message,
          code: error.code,
          timestamp: error.timestamp,
        },
        { status: error.statusCode }
      ),
      status: error.statusCode,
    };
  }

  if (error instanceof ZodError) {
    return {
      error: NextResponse.json(
        {
          message: 'Input validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      ),
      status: 400,
    };
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    if (prismaError.code === 'P2002') {
      return {
        error: NextResponse.json(
          {
            message: 'Duplicate entry found',
            code: 'DUPLICATE_ERROR',
            field: prismaError.meta?.target,
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        ),
        status: 409,
      };
    }

    if (prismaError.code === 'P2025') {
      return {
        error: NextResponse.json(
          {
            message: 'Record not found',
            code: 'NOT_FOUND_ERROR',
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        ),
        status: 404,
      };
    }

    if (prismaError.code === 'P2003') {
      return {
        error: NextResponse.json(
          {
            message: 'Foreign key constraint failed',
            code: 'FOREIGN_KEY_ERROR',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        ),
        status: 400,
      };
    }
  }

  // Handle generic errors
  const statusCode = (error as AppError)?.statusCode || 500;
  const message = (error as AppError)?.message || 'Internal server error';

  return {
    error: NextResponse.json(
      {
        message,
        code: (error as AppError)?.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: (error as Error)?.stack }),
      },
      { status: statusCode }
    ),
    status: statusCode,
  };
}

// Input validation helper
export function validateInput<T>(
  schema: any,
  data: unknown,
  context?: { endpoint?: string; method?: string }
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('🔍 Validation error:', {
        endpoint: context?.endpoint,
        method: context?.method,
        errors: error.errors,
        data: typeof data === 'object' ? Object.keys(data as any) : data,
      });
      
      throw new ValidationError('Input validation failed', {
        validationErrors: error.errors,
        inputData: data,
        endpoint: context?.endpoint,
        method: context?.method,
      });
    }
    throw error;
  }
}

// Async error wrapper for API routes
export function asyncHandler(
  fn: (req: any, context?: any) => Promise<NextResponse>
) {
  return async (req: any, context?: any) => {
    try {
      return await fn(req, context);
    } catch (error) {
      console.error('🚨 Unhandled error in API route:', error);
      const { error: errorResponse } = handleApiError(error, {
        endpoint: req?.url,
        method: req?.method,
      });
      return errorResponse;
    }
  };
}

// Client-side error handler
export function handleClientError(error: Error, context?: any) {
  console.error('🚨 Client-side error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  });

  // You can send errors to an error tracking service here
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    console.error('CLIENT_ERROR_LOG:', JSON.stringify({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}

// Global unhandled error handlers
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Promise Rejection:', {
      reason,
      promise,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Handle warnings
  process.on('warning', (warning) => {
    console.warn('⚠️ Node.js Warning:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
      timestamp: new Date().toISOString(),
    });
  });
}

// Initialize global error handlers
setupGlobalErrorHandlers();
