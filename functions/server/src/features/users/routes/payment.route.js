const express = require('express');
const controller = require('../controllers/payment.controller');
const auth = require('../../../middlewares/auth.middleware');
const clientOnly = require('../../../middlewares/client.middleware');
const { paymentLimiter } = require('../../../middlewares/rateLimiter');

const router = express.Router();

// All routes require authentication (client users only - for Flutter app)
router.use(auth, clientOnly);

// Apply payment rate limiting to all payment-related routes
router.use(paymentLimiter);

// Get pending payments (for Flutter app)
router.get('/pending', controller.getPendingPayments);

// Razorpay payment routes (for Flutter app - when admin has Razorpay configured)
router.post('/razorpay/order', controller.createRazorpayOrder);
router.post('/razorpay/verify', controller.verifyRazorpayPayment);

// QR code payment routes (for Flutter app - when admin has UPI ID configured)
router.get('/qr/:emiPaymentId', controller.getQRCode);
router.post('/qr/verify', controller.verifyQRCodePayment);

// Bank transfer payment routes (for Flutter app - when admin has bank details configured)
router.post('/bank/verify', controller.submitBankTransferPayment);

module.exports = router;

