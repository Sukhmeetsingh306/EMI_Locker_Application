const path = require('path');
const dotenv = require('dotenv');

const projectRoot =
  process.env.SERVER_ROOT || path.resolve(__dirname, '../../');

const envPath = process.env.NODE_ENV === 'test'
  ? path.join(projectRoot, '.env.test')
  : path.join(projectRoot, '.env');

dotenv.config({
  path: envPath,
});

// Helper function to parse integer from env with default
const parseIntEnv = (envVar, defaultValue) => {
  return parseInt(process.env[envVar] || defaultValue, 10);
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/emilocker',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  fcmServiceAccount: process.env.FCM_SERVICE_ACCOUNT || null,
  
  // Rate Limiting Configuration (all times in minutes)
  rateLimit: {
    // General rate limiting
    windowMinutes: parseIntEnv('RATE_LIMIT_WINDOW_MINUTES', 15),
    generalMax: parseIntEnv('RATE_LIMIT_GENERAL_MAX', 100),
    speedDelayAfter: parseIntEnv('RATE_LIMIT_SPEED_DELAY_AFTER', 50),
    speedDelayMs: parseIntEnv('RATE_LIMIT_SPEED_DELAY_MS', 100),
    speedMaxDelayMs: parseIntEnv('RATE_LIMIT_SPEED_MAX_DELAY_MS', 2000),
    
    // Auth rate limiting
    authWindowMinutes: parseIntEnv('RATE_LIMIT_AUTH_WINDOW_MINUTES', 15),
    authMax: parseIntEnv('RATE_LIMIT_AUTH_MAX', 5),
    
    // Payment rate limiting
    paymentWindowMinutes: parseIntEnv('RATE_LIMIT_PAYMENT_WINDOW_MINUTES', 15),
    paymentMax: parseIntEnv('RATE_LIMIT_PAYMENT_MAX', 20),
    
    // Admin rate limiting
    adminWindowMinutes: parseIntEnv('RATE_LIMIT_ADMIN_WINDOW_MINUTES', 15),
    adminMax: parseIntEnv('RATE_LIMIT_ADMIN_MAX', 200),
    
    // User management rate limiting
    userManagementWindowMinutes: parseIntEnv('RATE_LIMIT_USER_MANAGEMENT_WINDOW_MINUTES', 15),
    userManagementMax: parseIntEnv('RATE_LIMIT_USER_MANAGEMENT_MAX', 30),
    
    // Device lock rate limiting
    deviceLockWindowMinutes: parseIntEnv('RATE_LIMIT_DEVICE_LOCK_WINDOW_MINUTES', 15),
    deviceLockMax: parseIntEnv('RATE_LIMIT_DEVICE_LOCK_MAX', 30),
    
    // Client rate limiting
    clientWindowMinutes: parseIntEnv('RATE_LIMIT_CLIENT_WINDOW_MINUTES', 15),
    clientMax: parseIntEnv('RATE_LIMIT_CLIENT_MAX', 60),
    
    // Dashboard rate limiting
    dashboardWindowMinutes: parseIntEnv('RATE_LIMIT_DASHBOARD_WINDOW_MINUTES', 15),
    dashboardMax: parseIntEnv('RATE_LIMIT_DASHBOARD_MAX', 40),
  },
};

module.exports = env;

