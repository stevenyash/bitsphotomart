/**
 * Simple in-memory rate limiter for API routes
 * 
 * Note: For production deployments, consider using Redis or a dedicated
 * rate limiting service like Upstash, Cloudflare, or Vercel's built-in limits.
 */

// Simple in-memory store for rate limiting
// In production, use Redis or similar distributed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  
  const record = rateLimitStore.get(key);
  
  // If no record or expired, create new
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    };
  }
  
  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  };
}

/**
 * Clean up expired rate limit entries
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Strict limits for authentication
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 requests per 15 min
  // Payment endpoints - stricter
  PAYMENT: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 requests per min
  // Upload limits
  UPLOAD: { windowMs: 60 * 1000, maxRequests: 20 },  // 20 uploads per min
  // API search - more lenient
  SEARCH: { windowMs: 60 * 1000, maxRequests: 60 },  // 60 requests per min
  // Default API
  DEFAULT: { windowMs: 60 * 1000, maxRequests: 100 },  // 100 requests per min
} as const;

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
