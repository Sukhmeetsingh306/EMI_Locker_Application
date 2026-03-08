const logger = require('../config/logger');
const env = require('../config/env');

/**
 * DOS/DDoS/ReDoS Protection Middleware
 * Protects against Denial of Service attacks including:
 * - DOS: Denial of Service
 * - DDoS: Distributed Denial of Service (mitigated by rate limiting)
 * - ReDoS: Regular Expression Denial of Service
 */

// Request timeout configuration (in milliseconds)
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10); // 30 seconds default

// Maximum input length limits
const MAX_INPUT_LENGTHS = {
  string: parseInt(process.env.MAX_STRING_LENGTH || '10000', 10), // 10KB default
  array: parseInt(process.env.MAX_ARRAY_LENGTH || '1000', 10), // 1000 items default
  objectKeys: parseInt(process.env.MAX_OBJECT_KEYS || '100', 10), // 100 keys default
  regexInput: parseInt(process.env.MAX_REGEX_INPUT_LENGTH || '1000', 10), // 1KB for regex inputs (ReDoS protection)
};

/**
 * Request timeout middleware
 * Kills requests that take too long to process
 */
const requestTimeout = (req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      logger.warn({
        ip: req.ip,
        path: req.path,
        method: req.method,
        timeout: REQUEST_TIMEOUT,
      }, 'Request timeout exceeded');
      
      res.status(408).json({
        code: 408,
        message: 'Request timeout. Please try again.',
      });
    }
  }, REQUEST_TIMEOUT);

  // Clear timeout when response is sent
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));

  next();
};

/**
 * Input size validation middleware
 * Prevents excessively large inputs that could cause DOS
 */
const inputSizeValidation = (req, res, next) => {
  try {
    // Validate request body size
    if (req.body && typeof req.body === 'object') {
      const validateObject = (obj, depth = 0) => {
        // Prevent deep nesting (max 10 levels)
        if (depth > 10) {
          throw new Error('Object nesting too deep');
        }

        if (Array.isArray(obj)) {
          if (obj.length > MAX_INPUT_LENGTHS.array) {
            throw new Error(`Array too large. Maximum ${MAX_INPUT_LENGTHS.array} items allowed.`);
          }
          obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
              validateObject(item, depth + 1);
            } else if (typeof item === 'string' && item.length > MAX_INPUT_LENGTHS.string) {
              throw new Error(`String too long. Maximum ${MAX_INPUT_LENGTHS.string} characters allowed.`);
            }
          });
        } else {
          const keys = Object.keys(obj);
          if (keys.length > MAX_INPUT_LENGTHS.objectKeys) {
            throw new Error(`Object has too many keys. Maximum ${MAX_INPUT_LENGTHS.objectKeys} keys allowed.`);
          }

          for (const [key, value] of Object.entries(obj)) {
            // Validate key length
            if (key.length > 100) {
              throw new Error('Object key too long. Maximum 100 characters allowed.');
            }

            if (typeof value === 'string' && value.length > MAX_INPUT_LENGTHS.string) {
              throw new Error(`String too long. Maximum ${MAX_INPUT_LENGTHS.string} characters allowed.`);
            } else if (typeof value === 'object' && value !== null) {
              validateObject(value, depth + 1);
            }
          }
        }
      };

      validateObject(req.body);
    }

    // Validate query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && value.length > MAX_INPUT_LENGTHS.string) {
          throw new Error(`Query parameter value too long. Maximum ${MAX_INPUT_LENGTHS.string} characters allowed.`);
        }
        if (Array.isArray(value) && value.length > MAX_INPUT_LENGTHS.array) {
          throw new Error(`Query parameter array too large. Maximum ${MAX_INPUT_LENGTHS.array} items allowed.`);
        }
      }
    }

    // Validate URL parameters
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string' && value.length > 500) {
          throw new Error('URL parameter too long. Maximum 500 characters allowed.');
        }
      }
    }

    next();
  } catch (error) {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      error: error.message,
    }, 'Input size validation failed');
    
    res.status(400).json({
      code: 400,
      message: error.message || 'Invalid input size',
    });
  }
};

/**
 * ReDoS Protection Middleware
 * Limits regex input length to prevent Regular Expression Denial of Service attacks
 * Regex patterns with nested quantifiers can cause catastrophic backtracking
 */
const redosProtection = (req, res, next) => {
  try {
    // Limit search/query parameters that might be used in regex
    const regexFields = ['search', 'query', 'filter', 'pattern', 'regex'];
    
    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (regexFields.includes(key.toLowerCase()) && typeof value === 'string') {
          if (value.length > MAX_INPUT_LENGTHS.regexInput) {
            logger.warn({
              ip: req.ip,
              path: req.path,
              method: req.method,
              field: key,
              length: value.length,
            }, 'ReDoS protection: Regex input too long');
            
            return res.status(400).json({
              code: 400,
              message: `Search/query parameter too long. Maximum ${MAX_INPUT_LENGTHS.regexInput} characters allowed.`,
            });
          }
        }
      }
    }

    // Check body parameters
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (regexFields.includes(key.toLowerCase()) && typeof value === 'string') {
          if (value.length > MAX_INPUT_LENGTHS.regexInput) {
            logger.warn({
              ip: req.ip,
              path: req.path,
              method: req.method,
              field: key,
              length: value.length,
            }, 'ReDoS protection: Regex input too long');
            
            return res.status(400).json({
              code: 400,
              message: `Search/query parameter too long. Maximum ${MAX_INPUT_LENGTHS.regexInput} characters allowed.`,
            });
          }
        }
      }
    }

    next();
  } catch (error) {
    logger.error({ error, path: req.path }, 'Error in ReDoS protection');
    next();
  }
};

module.exports = {
  requestTimeout,
  inputSizeValidation,
  redosProtection,
};

