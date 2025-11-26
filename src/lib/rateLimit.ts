/**
 * In-memory rate limiter for API routes.
 * For production, use Redis or a dedicated service.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, email, etc.)
 * @param config - Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${identifier}-${Math.floor(now / config.windowMs)}`;

  let record = rateLimitStore.get(key);

  if (!record) {
    record = { count: 0, resetTime: now + config.windowMs };
    rateLimitStore.set(key, record);
  }

  const isAllowed = record.count < config.maxRequests;
  record.count += 1;

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  return {
    allowed: isAllowed,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Default rate limit configs
 */
export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
  API: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
};
