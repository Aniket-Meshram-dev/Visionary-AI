/**
 * High-Performance Sliding Window In-Memory Rate Limiter
 * Zero external dependencies. Bounded memory with automated cleanup.
 */
const rateLimitMap = new Map();

// Periodic prune every 10 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * Creates a rate limiting middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time frame for requests in milliseconds (default 15 minutes)
 * @param {number} options.max - Max number of connections during windowMs (default 100)
 * @param {string} options.message - Error message when rate limit exceeded
 */
export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  return (req, res, next) => {
    // When trust proxy is active, req.ip safely reflects client IP behind Render/Cloudflare
    const clientIp = req.ip || req.socket?.remoteAddress || 'unknown-ip';
    const key = req.userId ? `usr_${req.userId}` : `ip_${clientIp}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    rateLimitMap.set(key, record);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
};

// Admin route specific rate limiter: 60 requests per 5 minutes
export const adminRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 60,
  message: 'Security Alert: Admin request rate limit exceeded. Please wait a few minutes.',
});

// AI route specific rate limiter: 120 requests per 15 minutes
export const aiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'AI Generation Rate Limit Exceeded. Please slow down and try again in a few moments.',
});

export default createRateLimiter;
