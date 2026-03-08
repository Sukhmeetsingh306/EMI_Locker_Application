const router = require('express').Router();
const controller = require('../controllers/emiPaymentTransaction.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const { paymentLimiter } = require('../../../middlewares/rateLimiter');

// Apply payment rate limiting to all EMI payment transaction routes
router.use(paymentLimiter);

// All routes require admin authentication
router.use(auth, adminOnly);

// Get all EMI payment transactions for admin (with filters)
router.get('/', controller.getAllTransactions);

// Get pending EMI payment transactions (QR and Bank transfers only)
router.get('/pending', controller.getPendingTransactions);

// Verify (approve) a payment transaction
router.post('/:transactionId/verify', controller.verifyTransaction);

// Reject a payment transaction
router.post('/:transactionId/reject', controller.rejectTransaction);

module.exports = router;

