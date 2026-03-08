const router = require('express').Router();
const controller = require('../controllers/paymentConfig.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const { adminLimiter } = require('../../../middlewares/rateLimiter');

// Admin can update their payment configuration
router.put('/', auth, adminOnly, adminLimiter, controller.updatePaymentConfig);

// Admin can get their payment configuration
router.get('/', auth, adminOnly, adminLimiter, controller.getPaymentConfig);

// Superadmin can view all admins' payment configs
router.get('/all', auth, superadmin, adminLimiter, controller.getAllAdminsPaymentConfig);

// Superadmin can view a specific admin's payment config
router.get('/admin/:adminId', auth, superadmin, adminLimiter, controller.getAdminPaymentConfig);

// Superadmin can update a specific admin's payment config
router.put('/admin/:adminId', auth, superadmin, adminLimiter, controller.updateAdminPaymentConfig);

module.exports = router;

