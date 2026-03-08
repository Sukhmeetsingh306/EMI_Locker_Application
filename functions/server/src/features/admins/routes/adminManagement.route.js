const router = require('express').Router();
const controller = require('../controllers/adminManagement.controller');
const auth = require('../../../middlewares/auth.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const { adminLimiter } = require('../../../middlewares/rateLimiter');

// Get current admin profile (admin or superadmin)
router.get('/me', auth, adminOnly, adminLimiter, controller.getMyProfile);
// Update current admin profile (admin or superadmin)
router.put('/me', auth, adminOnly, adminLimiter, controller.updateMyProfile);

// ADMIN CASH DEPOSIT ROUTES
router.get('/cash-deposits', auth, adminOnly, adminLimiter, controller.getCashDeposits);

// ONLY SUPERADMIN CAN USE THESE ROUTES
router.post('/', auth, superadmin, adminLimiter, controller.createAdmin);
router.get('/', auth, superadmin, adminLimiter, controller.getAdmins);
router.get('/:id', auth, superadmin, adminLimiter, controller.getAdminById);
router.put('/:id', auth, superadmin, adminLimiter, controller.updateAdmin);

// SUPERADMIN CASH DEPOSIT MANAGEMENT ROUTES
router.get('/cash-deposits/all', auth, superadmin, adminLimiter, controller.getAllCashDeposits);
router.post('/cash-deposits/:depositId/approve', auth, superadmin, adminLimiter, (req, res, next) => {
  console.log('APPROVE ROUTE HIT - depositId:', req.params.depositId);
  console.log('APPROVE ROUTE HIT - body:', req.body);
  console.log('APPROVE ROUTE HIT - user:', req.user?.id);
  next();
}, controller.approveCashDeposit);
router.post('/cash-deposits/:depositId/reject', auth, superadmin, adminLimiter, controller.rejectCashDeposit);

router.post('/:id/block', auth, superadmin, adminLimiter, controller.blockAdmin);
router.post('/:id/unblock', auth, superadmin, adminLimiter, controller.unblockAdmin);
router.post('/transfer', auth, superadmin, adminLimiter, controller.transferAdmin);
router.delete('/:id', auth, superadmin, adminLimiter, controller.deleteAdmin); // Blocks instead of deleting

module.exports = router;
