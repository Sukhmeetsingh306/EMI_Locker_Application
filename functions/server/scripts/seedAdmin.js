require('../src/config/env');
const connectDatabase = require('../src/config/database');
const logger = require('../src/config/logger');
const Admin = require('../src/features/admins/models/admin.model');

const email = process.env.ADMIN_DEFAULT_EMAIL || 'superadmin@emilocker.com';
const password = process.env.ADMIN_DEFAULT_PASSWORD || 'SuperAdmin@123';
const name = process.env.ADMIN_DEFAULT_NAME || 'Super Admin';

const upsertSuperAdmin = async () => {
  await connectDatabase();

  const existing = await Admin.findOne({ email }).select('+password');

  if (existing) {
    existing.role = 'superadmin';
    if (password) {
      existing.password = password;
    }
    await existing.save();
    logger.info(`Superadmin user updated for ${email}`);
  } else {
    await Admin.create({
      name,
      email,
      password,
      role: 'superadmin',
      status: 1,
    });
    logger.info(`Superadmin user created for ${email}`);
  }

  logger.info('Superadmin seed completed');
  process.exit(0);
};

upsertSuperAdmin().catch((error) => {
  logger.error({ err: error }, 'Superadmin seeding failed');
  process.exit(1);
});

