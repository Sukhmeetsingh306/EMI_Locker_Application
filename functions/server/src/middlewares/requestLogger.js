const logger = require('../config/logger');

/**
 * Request logging middleware
 * Logs all incoming requests with relevant information
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info({
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    contentType: req.get('content-type'),
    // Don't log sensitive data like passwords
    body: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params,
  }, 'Incoming request');

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request warning');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
};

/**
 * Sanitize request body to remove sensitive information before logging
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard', 'cvv', 'ssn'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
};

module.exports = requestLogger;
