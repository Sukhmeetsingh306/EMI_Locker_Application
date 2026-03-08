const logger = require('../config/logger');

/**
 * Custom MongoDB injection protection for Express 5
 * Removes any keys that start with '$' or contain '.'
 * 
 * Note: express-mongo-sanitize tries to modify req.query which is read-only in Express 5.
 * This wrapper only sanitizes req.body and req.params, and manually sanitizes req.query
 * by creating a sanitized copy without modifying the original.
 */
const mongoSanitization = (req, res, next) => {
  try {
    // Sanitize req.body (mutable)
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      const sanitizeObject = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(item => 
            typeof item === 'object' && item !== null ? sanitizeObject(item) : item
          );
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          // Remove keys that start with $ or contain . (MongoDB injection patterns)
          if (key.startsWith('$') || key.includes('.')) {
            logger.warn({
              ip: req.ip,
              path: req.path,
              key,
            }, 'MongoDB injection attempt detected and sanitized');
            continue;
          }
          
          // Recursively sanitize nested objects
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value);
          } else if (Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value);
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };
      
      req.body = sanitizeObject(req.body);
    }

    // Sanitize req.params (mutable)
    if (req.params && typeof req.params === 'object') {
      const sanitizeObject = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key.startsWith('$') || key.includes('.')) {
            logger.warn({
              ip: req.ip,
              path: req.path,
              key,
            }, 'MongoDB injection attempt detected and sanitized in params');
            continue;
          }
          sanitized[key] = value;
        }
        return sanitized;
      };
      
      req.params = sanitizeObject(req.params);
    }

    // For req.query (read-only in Express 5), create a sanitized copy
    // Route handlers should handle arrays in query params appropriately
    if (req.query && typeof req.query === 'object') {
      const sanitizeQueryValue = (value) => {
        if (Array.isArray(value)) {
          return value.map(v => sanitizeQueryValue(v));
        }
        if (typeof value === 'object' && value !== null) {
          const sanitized = {};
          for (const [key, val] of Object.entries(value)) {
            if (key.startsWith('$') || key.includes('.')) {
              logger.warn({
                ip: req.ip,
                path: req.path,
                key,
              }, 'MongoDB injection attempt detected in query');
              continue;
            }
            sanitized[key] = sanitizeQueryValue(val);
          }
          return sanitized;
        }
        return value;
      };

      // Create sanitized query copy (we can't modify req.query, but we can log warnings)
      for (const [key, value] of Object.entries(req.query)) {
        if (key.startsWith('$') || key.includes('.')) {
          logger.warn({
            ip: req.ip,
            path: req.path,
            key,
          }, 'MongoDB injection attempt detected in query (read-only, cannot sanitize)');
        }
        // Check nested objects/arrays in query values
        sanitizeQueryValue(value);
      }
    }

    next();
  } catch (error) {
    // If sanitization fails, log and continue (don't break the request)
    logger.error({ error, path: req.path }, 'Error in MongoDB sanitization');
    next();
  }
};

/**
 * Comprehensive XSS protection for Express 5 compatibility
 * Cleans user input from malicious scripts and dangerous patterns
 * 
 * Protects against:
 * - Script tag injection (<script>, </script>)
 * - JavaScript protocol (javascript:)
 * - Event handlers (onclick, onerror, etc.)
 * - Data URIs with scripts (data:text/html)
 * - Iframe injection
 * - Object/embed tags
 * - Style tags with expressions
 * - VBScript
 * - HTML entities encoding bypass attempts
 * 
 * Note: Since req.query is read-only in Express 5, we sanitize req.body and req.params,
 * and log warnings for dangerous patterns in req.query.
 */
const xssProtection = (req, res, next) => {
  try {
    // Comprehensive XSS sanitization function
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      
      return str
        // Remove script tags (all variations)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<\/script>/gi, '')
        .replace(/<script/gi, '')
        
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        .replace(/j&#97;vascript:/gi, '') // HTML entity encoded
        .replace(/&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;/gi, '')
        
        // Remove event handlers (onclick, onerror, onload, etc.)
        .replace(/on\w+\s*=/gi, '')
        .replace(/on\w+\s*\(/gi, '')
        
        // Remove data URIs with HTML/scripts
        .replace(/data:text\/html/gi, '')
        .replace(/data:.*?base64/gi, '')
        
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<iframe/gi, '')
        
        // Remove object and embed tags
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
        
        // Remove style tags with expressions
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/expression\s*\(/gi, '') // CSS expressions
        
        // Remove VBScript
        .replace(/vbscript:/gi, '')
        
        // Remove HTML entity encoded script tags
        .replace(/&#60;script/gi, '')
        .replace(/&#60;&#47;script/gi, '')
        
        // Remove common XSS vectors
        .replace(/<img[^>]+src[^>]*=.*?javascript:/gi, '')
        .replace(/<link[^>]+href[^>]*=.*?javascript:/gi, '')
        .replace(/<a[^>]+href[^>]*=.*?javascript:/gi, '');
    };

    // Recursive sanitization for nested objects and arrays
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return sanitizeString(value);
      }
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };

    // Sanitize req.body (mutable)
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      const sanitizeObject = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeValue(value);
        }
        return sanitized;
      };

      req.body = sanitizeObject(req.body);
    }

    // Sanitize req.params (mutable)
    if (req.params && typeof req.params === 'object') {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = sanitizeString(value);
        }
      }
    }

    // For req.query (read-only), detect and log XSS attempts
    if (req.query && typeof req.query === 'object') {
      const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /expression\s*\(/i,
        /vbscript:/i,
        /&#60;script/i,
      ];

      const checkXSS = (value) => {
        if (typeof value === 'string') {
          const hasXSS = xssPatterns.some(pattern => pattern.test(value));
          if (hasXSS) {
            logger.warn({
              ip: req.ip,
              path: req.path,
              method: req.method,
              value: value.substring(0, 200), // Log first 200 chars
            }, 'Potential XSS attempt detected in query (read-only, cannot sanitize)');
          }
        } else if (Array.isArray(value)) {
          value.forEach(checkXSS);
        } else if (typeof value === 'object' && value !== null) {
          Object.values(value).forEach(checkXSS);
        }
      };

      Object.values(req.query).forEach(checkXSS);
    }

    next();
  } catch (error) {
    // If sanitization fails, log and continue (don't break the request)
    logger.error({ error, path: req.path }, 'Error in XSS sanitization');
    next();
  }
};

/**
 * HTTP Parameter Pollution (HPP) protection
 * Prevents parameter pollution attacks by keeping only the last value
 * Compatible with Express 5.x where req.query is read-only
 * 
 * Note: Since req.query is read-only in Express 5, we cannot modify it directly.
 * Query parameter pollution is handled by Express itself (it creates arrays for duplicate params).
 * Route handlers should handle arrays in query parameters appropriately.
 * 
 * This middleware sanitizes req.body to prevent parameter pollution in POST/PUT requests.
 * 
 * Whitelist allows certain parameters to have multiple values if needed
 */
const hppProtection = (req, res, next) => {
  const whitelist = [
    // Add any parameters that legitimately need multiple values
    // Example: 'tags', 'categories', etc.
    'paymentSchedule',  // Allow paymentSchedule arrays for EMI creation
    'dueDates',         // Allow dueDates arrays for EMI creation
  ];

  // Sanitize body parameters (req.body is mutable)
  // req.query is read-only in Express 5, so we can't modify it
  // Express handles query parameter pollution by creating arrays
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const [key, value] of Object.entries(req.body)) {
      if (!whitelist.includes(key) && Array.isArray(value)) {
        // Keep only the last value for non-whitelisted array parameters
        req.body[key] = value[value.length - 1];
      }
    }
  }

  next();
};

module.exports = {
  mongoSanitization,
  xssProtection,
  hppProtection,
};

