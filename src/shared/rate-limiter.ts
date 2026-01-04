/**
 * Rate Limiter
 *
 * Simple in-memory rate limiting using token bucket algorithm
 * Prevents API abuse by limiting requests per IP/user
 */

import logger from "./logger.js";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory
// For production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request should be rate limited
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now);
  }

  // No entry or expired - create new
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    logger.warn(
      { identifier, count: entry.count, retryAfter },
      "Rate limit exceeded"
    );
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(now: number): void {
  let cleaned = 0;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug({ cleaned }, "Cleaned up expired rate limit entries");
  }
}

/**
 * Get IP address from request
 */
export function getClientIP(req: {
  headers: { [key: string]: string | string[] | undefined };
  socket: { remoteAddress?: string };
}): string {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0];
    return ip.trim();
  }

  // Check for real IP (CloudFlare, etc.)
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket address
  return req.socket.remoteAddress || "unknown";
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // Very strict - 10 requests per minute
  STRICT: { windowMs: 60 * 1000, maxRequests: 10 },

  // Standard - 30 requests per minute
  STANDARD: { windowMs: 60 * 1000, maxRequests: 30 },

  // Lenient - 100 requests per minute
  LENIENT: { windowMs: 60 * 1000, maxRequests: 100 },

  // Very lenient - 1000 requests per hour
  HOURLY: { windowMs: 60 * 60 * 1000, maxRequests: 1000 },
};
