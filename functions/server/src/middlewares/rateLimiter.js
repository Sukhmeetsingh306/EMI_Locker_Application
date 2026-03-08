const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../config/logger');
const env = require('../config/env');

// Helper function to convert minutes to milliseconds
const minutesToMs = (minutes) => minutes * 60 * 1000;

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.windowMinutes),
  max: env.rateLimit.generalMax,
  message: {
    code: 429,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
    }, 'Rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Slow down middleware - gradually increases response time for repeated requests
const speedLimiter = slowDown({
  windowMs: minutesToMs(env.rateLimit.windowMinutes),
  delayAfter: env.rateLimit.speedDelayAfter,
  delayMs: () => env.rateLimit.speedDelayMs,
  maxDelayMs: env.rateLimit.speedMaxDelayMs,
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.authWindowMinutes),
  max: env.rateLimit.authMax,
  message: {
    code: 429,
    message: `Too many login attempts, please try again after ${env.rateLimit.authWindowMinutes} minutes.`,
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      email: req.body?.email,
    }, 'Auth rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: `Too many login attempts, please try again after ${env.rateLimit.authWindowMinutes} minutes.`,
    });
  },
});

// Strict rate limiter for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.paymentWindowMinutes),
  max: env.rateLimit.paymentMax,
  message: {
    code: 429,
    message: 'Too many payment requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    }, 'Payment rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many payment requests, please try again later.',
    });
  },
});

// Rate limiter for admin operations
const adminLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.adminWindowMinutes),
  max: env.rateLimit.adminMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    }, 'Admin rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many admin requests, please try again later.',
    });
  },
});

// Rate limiter for user management operations
const userManagementLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.userManagementWindowMinutes),
  max: env.rateLimit.userManagementMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    }, 'User management rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many user management requests, please try again later.',
    });
  },
});

// Rate limiter for device lock operations
const deviceLockLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.deviceLockWindowMinutes),
  max: env.rateLimit.deviceLockMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    }, 'Device lock rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many device lock requests, please try again later.',
    });
  },
});

// Rate limiter for client-facing operations (EMI viewing, profile, etc.)
const clientLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.clientWindowMinutes),
  max: env.rateLimit.clientMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    }, 'Client rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many requests, please try again later.',
    });
  },
});

// Rate limiter for dashboard/stats operations
const dashboardLimiter = rateLimit({
  windowMs: minutesToMs(env.rateLimit.dashboardWindowMinutes),
  max: env.rateLimit.dashboardMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
    }, 'Dashboard rate limit exceeded');
    res.status(429).json({
      code: 429,
      message: 'Too many dashboard requests, please try again later.',
    });
  },
});

module.exports = {
  generalLimiter,
  speedLimiter,
  authLimiter,
  paymentLimiter,
  adminLimiter,
  userManagementLimiter,
  deviceLockLimiter,
  clientLimiter,
  dashboardLimiter,
};

