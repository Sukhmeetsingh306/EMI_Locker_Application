const env = require('./config/env');
const logger = require('./config/logger');
const connectDatabase = require('./config/database');
const app = require('./app');

const start = async () => {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
      
      // Start cron job scheduler
      logger.info('Starting cron job scheduler...');
      require('../scripts/cron.js');
      logger.info('Cron job scheduler initialized');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

start();



