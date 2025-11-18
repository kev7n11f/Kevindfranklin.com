/**
 * Simple in-memory rate limiter for Vercel serverless functions
 * Note: This is basic and resets on each cold start. For production,
 * consider using Vercel's Edge Config or Upstash Redis
 */

const requests = new Map();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

/**
 * Rate limit middleware
 * @param {string} identifier - Usually IP address or user ID
 * @param {number} max - Max requests in window (optional)
 * @param {number} windowMs - Time window in ms (optional)
 * @returns {object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, max = MAX_REQUESTS, windowMs = WINDOW_MS) {
  const now = Date.now();
  const key = `${identifier}`;

  // Get or create record
  let record = requests.get(key);

  if (!record || now > record.resetTime) {
    // Create new window
    record = {
      count: 0,
      resetTime: now + windowMs,
    };
    requests.set(key, record);
  }

  // Increment count
  record.count++;

  const allowed = record.count <= max;
  const remaining = Math.max(0, max - record.count);

  // Cleanup old entries periodically (10% chance)
  if (Math.random() < 0.1) {
    cleanup();
  }

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
    retryAfter: allowed ? 0 : Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Cleanup expired rate limit entries
 */
function cleanup() {
  const now = Date.now();

  for (const [key, record] of requests.entries()) {
    if (now > record.resetTime) {
      requests.delete(key);
    }
  }
}

/**
 * Rate limit middleware for API routes
 */
export function rateLimitMiddleware(req, res, identifier = null) {
  const id = identifier || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  const result = checkRateLimit(id);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetTime);

  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter);
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: result.retryAfter,
    });
  }

  return result;
}

export default {
  checkRateLimit,
  rateLimitMiddleware,
};
