/**
 * Client-side logging utilities
 * Handles browser console logging and error reporting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logQueue: LogEntry[] = [];
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.startAutoFlush();
      this.setupGlobalErrorHandler();
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  /**
   * Log user action for analytics
   */
  track(action: string, properties?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      action,
      ...properties,
      tracking: true,
    });
  }

  /**
   * Log API request
   */
  apiRequest(endpoint: string, method: string, duration?: number, success = true) {
    this.info('API Request', {
      endpoint,
      method,
      duration,
      success,
      api: true,
    });
  }

  /**
   * Log API error
   */
  apiError(endpoint: string, error: any, context?: Record<string, any>) {
    this.error('API Error', {
      endpoint,
      error: error.message || error,
      status: error.status,
      ...context,
      api: true,
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, context?: Record<string, any>) {
    this.info('Performance Metric', {
      metric,
      value,
      ...context,
      performance: true,
    });
  }

  /**
   * Private logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    };

    // Add to queue
    this.logQueue.push(entry);

    // Keep queue size manageable
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift();
    }

    // Console logging (development only or for errors)
    if (this.isDevelopment || level === 'error') {
      const consoleMethod = level === 'debug' ? 'log' : level;
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, context || '');
    }

    // Immediate flush for errors
    if (level === 'error') {
      this.flushLogs();
    }
  }

  /**
   * Send logs to server
   */
  private async flushLogs() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      // If server logging fails, put logs back in queue
      console.warn('Failed to send logs to server:', error);
      this.logQueue.unshift(...logsToSend);
    }
  }

  /**
   * Start automatic log flushing
   */
  private startAutoFlush() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  /**
   * Setup global error handlers for unhandled errors
   */
  private setupGlobalErrorHandler() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
      });
    });

    // Handle React errors (if not caught by ErrorBoundary)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);

      // Log React errors
      if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
        return; // Skip React deprecation warnings
      }

      this.error('Console Error', {
        args: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ),
      });
    };
  }

  /**
   * Get current user ID from session
   */
  private getUserId(): string | undefined {
    // This would typically come from your auth context
    // For now, return undefined
    return undefined;
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string | undefined {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Manually flush logs (useful for testing)
   */
  flush() {
    return this.flushLogs();
  }

  /**
   * Get current queue size (useful for testing)
   */
  getQueueSize(): number {
    return this.logQueue.length;
  }
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Export types
export type { LogLevel, LogEntry };

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) =>
  clientLogger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, any>) =>
  clientLogger.info(message, context);

export const logWarn = (message: string, context?: Record<string, any>) =>
  clientLogger.warn(message, context);

export const logError = (message: string, context?: Record<string, any>) =>
  clientLogger.error(message, context);

export const trackEvent = (action: string, properties?: Record<string, any>) =>
  clientLogger.track(action, properties);

export default clientLogger;
