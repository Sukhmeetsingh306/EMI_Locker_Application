const pino = require('pino');
const env = require('./env');

const logger = pino({
  transport:
    env.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  level: env.nodeEnv === 'test' ? 'silent' : process.env.LOG_LEVEL || 'info',
});

module.exports = logger;



