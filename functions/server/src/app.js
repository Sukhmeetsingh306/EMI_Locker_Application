const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const notFoundHandler = require('./middlewares/notFound');
const { errorConverter, errorHandler } = require('./middlewares/errorHandler');
const { mongoSanitization, xssProtection, hppProtection } = require('./middlewares/sanitization');
const requestLogger = require('./middlewares/requestLogger');
const { generalLimiter, speedLimiter } = require('./middlewares/rateLimiter');
const { requestTimeout, inputSizeValidation, redosProtection } = require('./middlewares/dosProtection');
const env = require('./config/env');
const fcmService = require('./utils/fcm');
const deviceRoutes = require("./features/users/routes/device_route");


const app = express();

// Enhanced Helmet configuration for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Additional security headers
    noSniff: true, // Prevent MIME type sniffing
    xssFilter: true, // Enable XSS filter in browsers
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Control referrer information
    permittedCrossDomainPolicies: false, // Disable Adobe Flash and Acrobat cross-domain policies
    expectCt: {
      maxAge: 86400, // 24 hours
      enforce: true,
    },
  })
);
const parseCorsOrigins = () => {
  const configured = process.env.CORS_ORIGIN;
  if (!configured) {
    return true; // allow all origins by default
  }
  const trimmed = configured.trim();
  if (trimmed === '*' || trimmed.toLowerCase() === 'all') {
    return true;
  }
  return trimmed.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseCorsOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // If allowedOrigins is true (all allowed) or origin is in the list
      if (allowedOrigins === true || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn({ origin, allowedOrigins }, 'CORS: Origin not allowed');
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
  })
);
// Body parsing (must be before sanitization)
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit URL-encoded payload size
app.use(cookieParser());

// DOS/DDoS/ReDoS Protection (must be early in the middleware chain)
app.use(requestTimeout); // Request timeout protection
app.use(inputSizeValidation); // Input size validation
app.use(redosProtection); // ReDoS (Regular Expression DoS) protection

// Security: Sanitization middleware (protect against NoSQL injection, XSS, and parameter pollution)
app.use(mongoSanitization); // MongoDB injection protection
app.use(xssProtection); // XSS protection
app.use(hppProtection); // HTTP Parameter Pollution protection

// Request logging middleware (log all incoming requests)
app.use(requestLogger);
app.use("/downloads", require("express").static(__dirname + "/downloads"));
app.use("/api/device", deviceRoutes);
// Initialize Firebase Admin for FCM
fcmService.initializeFirebase();

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: env.nodeEnv });
});

// Apply speed limiter (gradual slowdown) and general rate limiting to all API routes
app.use('/api', speedLimiter, generalLimiter, routes);

app.use(notFoundHandler);
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;

