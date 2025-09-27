import { NextRequest } from 'next/server';
// Simple console logging to avoid import issues
const logger = {
  info: (...args: any[]) => console.log('[RATE-LIMIT]', ...args),
  warn: (...args: any[]) => console.warn('[RATE-LIMIT]', ...args),
  error: (...args: any[]) => console.error('[RATE-LIMIT]', ...args),
};

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: 'Too many requests',
};

// In-memory store for rate limiting (in production, use Redis)
const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const { windowMs, max, message } = { ...defaultConfig, ...config };

  return (request: NextRequest): { success: boolean; message?: string } => {
    const key = getRateLimitKey(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up expired entries
    const keysToDelete: string[] = [];
    store.forEach((v, k) => {
      if (v.resetTime < now) {
        keysToDelete.push(k);
      }
    });
    keysToDelete.forEach(key => store.delete(key));

    const current = store.get(key);
    
    if (!current) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true };
    }

    if (current.resetTime < now) {
      // Window expired, reset
      store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true };
    }

    if (current.count >= max) {
      logger.warn('Rate limit exceeded', {
        key,
        count: current.count,
        max,
        windowMs,
      });
      return { success: false, message };
    }

    current.count++;
    return { success: true };
  };
}

function getRateLimitKey(request: NextRequest): string {
  // Use IP address as the primary key
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  
  // For API routes, include the path to prevent one endpoint from blocking others
  const path = new URL(request.url).pathname;
  
  return `${ip}:${path}`;
}

export function createRateLimitMiddleware(config?: Partial<RateLimitConfig>) {
  return async (request: NextRequest) => {
    const result = rateLimit(config)(request);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.message }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((config?.windowMs || defaultConfig.windowMs) / 1000).toString(),
          },
        }
      );
    }
    
    return null; // Continue to next middleware
  };
}
