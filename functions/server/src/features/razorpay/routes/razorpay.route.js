const router = require('express').Router();
const controller = require('../controllers/razorpay.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const { paymentLimiter } = require('../../../middlewares/rateLimiter');

// Apply payment rate limiting to all payment routes
router.use(paymentLimiter);

// Create Razorpay order for package purchase
router.post('/package/order', auth, adminOnly, controller.createPackageOrder);

// Verify package payment
router.post('/package/verify', auth, adminOnly, controller.verifyPackagePayment);

module.exports = router;

