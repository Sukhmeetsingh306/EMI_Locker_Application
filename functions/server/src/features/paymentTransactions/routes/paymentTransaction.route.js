const router = require('express').Router();
const controller = require('../controllers/paymentTransaction.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const { paymentLimiter } = require('../../../middlewares/rateLimiter');

// Apply payment rate limiting to all payment transaction routes
router.use(paymentLimiter);

// Admin can create transaction to pay superadmin
router.post('/', auth, adminOnly, controller.createTransaction);

// Admin can view their transactions
router.get('/my-transactions', auth, adminOnly, controller.getAdminTransactions);

// Super admin can view all transactions
router.get('/', auth, superadmin, controller.getAllTransactions);

// Complete transaction
router.post('/:transactionId/complete', auth, controller.completeTransaction);

module.exports = router;

