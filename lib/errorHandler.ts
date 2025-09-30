import logger from './logger';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, any>;
}

export class ApplicationError extends Error implements AppError {
  public readonly code?: string;
  public readonly statusCode?: number;
  public isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code?: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, context);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', 500, context);
    this.name = 'DatabaseError';
    this.isOperational = false; // Database errors are typically not operational
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, context);
    this.name = 'ExternalServiceError';
  }
}

// Error logging utility
export function logError(error: Error | AppError, context?: Record<string, any>) {
  const errorContext = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Add additional context for ApplicationError instances
  if (error instanceof ApplicationError) {
    Object.assign(errorContext, {
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      errorContext: error.context,
      errorTimestamp: error.timestamp,
    });
  }

  // Log based on error type
  if (error instanceof ApplicationError && error.isOperational) {
    logger.warn('Operational error occurred', errorContext);
  } else {
    logger.error('Unexpected error occurred', errorContext);
  }
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // Give some time for logging to complete, then exit
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

// Error boundary helper for API routes
export function handleApiError(error: unknown, context?: Record<string, any>) {
  let appError: AppError;

  if (error instanceof ApplicationError) {
    appError = error;
  } else if (error instanceof Error) {
    // Convert generic errors to ApplicationError
    appError = new ApplicationError(
      error.message || 'An unexpected error occurred',
      'INTERNAL_ERROR',
      500,
      { originalError: error.name, ...context }
    );
  } else {
    // Handle non-Error objects
    appError = new ApplicationError(
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      500,
      { originalError: String(error), ...context }
    );
  }

  // Enhanced error logging
  const errorDetails = {
    name: appError.name,
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack,
    context: { ...appError.context, ...context },
    timestamp: appError.timestamp || new Date().toISOString(),
    isOperational: appError.isOperational,
  };

  // Log to console with structured format
  console.error(`[${errorDetails.timestamp}] API ERROR: ${errorDetails.name}`, {
    message: errorDetails.message,
    code: errorDetails.code,
    statusCode: errorDetails.statusCode,
    stack: errorDetails.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines
    context: errorDetails.context,
    isOperational: errorDetails.isOperational,
  });

  // Log the error using existing logger
  logError(appError, context);

  // Return appropriate response
  return {
    error: {
      message: appError.isOperational ? appError.message : 'Internal server error',
      code: appError.code,
      timestamp: errorDetails.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        stack: appError.stack,
        context: appError.context,
      }),
    },
    status: appError.statusCode || 500,
  };
}

// Retry utility for external service calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: Record<string, any>
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        logError(lastError, { attempt, maxRetries, ...context });
        throw lastError;
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed, retrying in ${waitTime}ms`, {
        error: lastError.message,
        attempt,
        maxRetries,
        waitTime,
        ...context,
      });

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 120000 // 2 minutes
  ) {}

  async execute<T>(fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker moving to HALF_OPEN state', context);
      } else {
        throw new ExternalServiceError('Circuit Breaker', 'Service is currently unavailable', context);
      }
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.reset();
        logger.info('Circuit breaker reset to CLOSED state', context);
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

// Database connection error handler
export function handleDatabaseError(error: any, operation: string, context?: Record<string, any>) {
  const dbError = new DatabaseError(
    `Database operation failed: ${operation}`,
    {
      operation,
      originalError: error.message,
      code: error.code,
      ...context,
    }
  );

  logError(dbError, context);
  throw dbError;
}

// Input validation helper
export function validateInput<T>(
  schema: { parse: (data: any) => T },
  data: any,
  context?: Record<string, any>
): T {
  try {
    return schema.parse(data);
  } catch (error: any) {
    const validationError = new ValidationError(
      'Input validation failed',
      {
        validationErrors: error.errors,
        inputData: data,
        ...context,
      }
    );

    logError(validationError, context);
    throw validationError;
  }
}
