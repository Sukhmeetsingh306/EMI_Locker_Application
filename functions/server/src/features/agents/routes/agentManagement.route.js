const router = require('express').Router();
const controller = require('../controllers/agentManagement.controller');
const auth = require('../../../middlewares/auth.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const agent = require('../../../middlewares/agent.middleware');
const { adminLimiter } = require('../../../middlewares/rateLimiter');

// AGENT SPECIFIC ROUTES - Must come first to avoid :id conflicts
router.get('/dashboard', auth, agent, adminLimiter, controller.getAgentDashboard);
router.get('/profile', auth, agent, adminLimiter, controller.getAgentProfile);
router.post('/admins', auth, agent, adminLimiter, controller.createAdminByAgent);
router.get('/admins', auth, agent, adminLimiter, controller.getAdminsByAgent);
router.get('/admins/:id', auth, agent, adminLimiter, controller.getAdminByIdByAgent);
router.get('/admins/:id/stats', auth, agent, adminLimiter, controller.getAdminStatsByAgent);
router.put('/admins/:id', auth, agent, adminLimiter, controller.updateAdminByAgent);

// AGENT CASH DEPOSIT ROUTES
router.post('/cash-deposit/request', auth, agent, adminLimiter, controller.requestCashDeposit);
router.get('/cash-deposits', auth, agent, adminLimiter, controller.getCashDeposits);

// ONLY SUPERADMIN CAN USE THESE ROUTES
router.post('/', auth, superadmin, adminLimiter, controller.createAgent);
router.get('/', auth, superadmin, adminLimiter, controller.getAgents);
router.get('/:id', auth, superadmin, adminLimiter, controller.getAgentById);
router.put('/:id', auth, superadmin, adminLimiter, controller.updateAgent);
router.post('/:id/block', auth, superadmin, adminLimiter, controller.blockAgent);
router.post('/:id/unblock', auth, superadmin, adminLimiter, controller.unblockAgent);
router.delete('/:id', auth, superadmin, adminLimiter, controller.deleteAgent); // Blocks instead of deleting

module.exports = router;

