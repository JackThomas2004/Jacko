const rateLimit = require('express-rate-limit');

/**
 * Auth rate limiter: 5 requests per 15 minutes per IP.
 * Applied to /register and /login.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in 15 minutes.' },
  skipSuccessfulRequests: false,
});

/**
 * Upload rate limiter: 20 requests per hour per IP.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit reached. Please try again later.' },
});

module.exports = { authLimiter, uploadLimiter };
