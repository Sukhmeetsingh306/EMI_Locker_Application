require('../src/config/env');
const connectDatabase = require('../src/config/database');
const logger = require('../src/config/logger');
const KeyPrice = require('../src/features/admin/models/keyPrice.model');

const defaultKeyPrices = [
  {
    packageName: 'Starter',
    keys: 100,
    price: 499,
    description: 'Perfect for small businesses',
    isActive: true
  },
  {
    packageName: 'Business',
    keys: 500,
    price: 999,
    description: 'Ideal for growing businesses',
    isActive: true
  },
  {
    packageName: 'Enterprise',
    keys: 1000,
    price: 1499,
    description: 'Best value for large operations',
    isActive: true
  }
];

const seedKeyPrices = async () => {
  await connectDatabase();

  for (const price of defaultKeyPrices) {
    const existing = await KeyPrice.findOne({ keys: price.keys });
    if (existing) {
      logger.info(`Key price for ${price.keys} keys already exists, skipping...`);
    } else {
      await KeyPrice.create(price);
      logger.info(`Created key price: ${price.packageName} - ${price.keys} keys @ ₹${price.price}`);
    }
  }

  logger.info('Key prices seeding completed');
  process.exit(0);
};

seedKeyPrices().catch((error) => {
  logger.error({ err: error }, 'Key prices seeding failed');
  process.exit(1);
});

