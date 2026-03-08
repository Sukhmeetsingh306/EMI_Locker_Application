const router = require('express').Router();
const controller = require('../controllers/dashboardStats.controller');
const summaryController = require('../controllers/dashboardSummary.controller');
const paymentsTodayController = require('../controllers/paymentsToday.controller');
const auth = require('../../../middlewares/auth.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const { dashboardLimiter } = require('../../../middlewares/rateLimiter');

// Apply dashboard rate limiting to all dashboard routes
router.use(dashboardLimiter);

// Lightweight dashboard summary - optimized for quick loading
router.get('/summary', auth, superadmin, summaryController.getDashboardSummary);

// Get admin-specific dashboard stats (for regular admins)
router.get('/admin-stats', auth, adminOnly, summaryController.getAdminDashboardStats);

// Get detailed stats for a specific admin
router.get('/admin/:adminId', auth, superadmin, controller.getAdminDetailedStats);

// Get payments today for admin (pending and today's paid)
router.get('/payments-today', auth, adminOnly, paymentsTodayController.getPaymentsToday);

// // Get total pending payments till today (standalone endpoint)
// router.get('/pending-payments', auth, adminOnly, summaryController.getTotalPendingPayments);

module.exports = router;

