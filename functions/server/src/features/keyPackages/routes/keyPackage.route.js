const router = require('express').Router();
const controller = require('../controllers/keyPackage.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const { adminLimiter } = require('../../../middlewares/rateLimiter');

// Apply admin rate limiting to all routes
router.use(adminLimiter);

// Get package configurations (public for admins)
router.get('/configs', auth, controller.getPackageConfigs);

// Admin can view their own packages
router.get('/my-packages', auth, adminOnly, controller.getAdminPackages);

// Super admin can view all packages
router.get('/', auth, superadmin, controller.getAllPackages);

// Get package by ID
router.get('/:id', auth, controller.getPackageById);

module.exports = router;

