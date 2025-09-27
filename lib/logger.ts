// Simple console-based logger compatible with edge runtime
// For production, replace with a proper logging service

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class SimpleLogger {
  private isDevelopment = typeof window !== 'undefined' || process.env.NODE_ENV !== 'production';

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: Record<string, any>) {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: Record<string, any>) {
    console.error(this.formatMessage('error', message, context));
  }
}

const logger = new SimpleLogger();

// Simple stubs for compatibility
export function createRequestLogger(requestId: string, additionalContext: any = {}) {
  return {
    info: (msg: string, ctx?: any) => logger.info(`[REQUEST:${requestId}] ${msg}`, { ...additionalContext, ...ctx }),
    warn: (msg: string, ctx?: any) => logger.warn(`[REQUEST:${requestId}] ${msg}`, { ...additionalContext, ...ctx }),
    error: (msg: string, ctx?: any) => logger.error(`[REQUEST:${requestId}] ${msg}`, { ...additionalContext, ...ctx }),
  };
}

export function logPerformance(operation: string, startTime: number, context: any = {}) {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    durationUnit: 'ms',
    ...context,
  });
}

export function logRequest(req: any, res?: any, context: any = {}) {
  const requestContext = {
    method: req.method,
    url: req.url,
    userAgent: req.headers?.['user-agent'],
    ip: req.ip || req.headers?.['x-forwarded-for']?.split(',')[0]?.trim(),
    ...context,
  };

  logger.info('HTTP Request', requestContext);

  // Log response when available
  if (res) {
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      logger.info('HTTP Response', {
        ...requestContext,
        statusCode: res.statusCode,
        responseTime: Date.now() - (res.startTime || Date.now()),
      });
      originalEnd.apply(this, args);
    };
    res.startTime = Date.now();
  }
}

export default logger;
