const express = require('express');
const authRoutes = require('../features/auth/routes/auth.route');
const userRoutes = require('../features/users/routes/user.route');
const userPaymentRoutes = require('../features/users/routes/payment.route');
const deviceLockRoutes = require('../features/deviceLock/routes/deviceLock.route');
const emiRoutes = require('../features/emi/routes/emi.route');
const adminRoutes = require('../features/admins/routes/adminManagement.route');
const keyPackageRoutes = require('../features/keyPackages/routes/keyPackage.route');
const paymentConfigRoutes = require('../features/paymentConfig/routes/paymentConfig.route');
const paymentTransactionRoutes = require('../features/paymentTransactions/routes/paymentTransaction.route');
const emiPaymentTransactionRoutes = require('../features/paymentTransactions/routes/emiPaymentTransaction.route');
const razorpayRoutes = require('../features/razorpay/routes/razorpay.route');
const dashboardStatsRoutes = require('../features/dashboard/routes/dashboardStats.route');
const keyPriceRoutes = require('../features/keyPrices/routes/keyPrice.route');
const agentRoutes = require('../features/agents/routes/agentManagement.route');


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users/payments', userPaymentRoutes);
router.use('/users', userRoutes);
router.use('/device-lock', deviceLockRoutes);
router.use('/emis', emiRoutes);
router.use('/admins', adminRoutes);
// Admin device routes (matches Flutter API structure)
router.use('/key-packages', keyPackageRoutes);
router.use('/payment-config', paymentConfigRoutes);
router.use('/payment-transactions', paymentTransactionRoutes);
router.use('/admins/emi-payment-transactions', emiPaymentTransactionRoutes);
router.use('/razorpay', razorpayRoutes);
router.use('/dashboard-stats', dashboardStatsRoutes);
router.use('/key-prices', keyPriceRoutes);
router.use('/agents', agentRoutes);

module.exports = router;

