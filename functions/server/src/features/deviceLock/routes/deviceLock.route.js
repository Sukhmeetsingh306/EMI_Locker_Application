const express = require('express');
const controller = require('../controllers/deviceLock.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const clientOnly = require('../../../middlewares/client.middleware');
const { deviceLockLimiter, clientLimiter } = require('../../../middlewares/rateLimiter');

const router = express.Router();

// Client: app calls this regularly to know if overlay is needed
router.get('/me', auth, clientOnly, clientLimiter, controller.getMyLockStatus);

// Admin: get users with overdue EMIs (with pagination and filters)
router.get('/overdue-users', auth, adminOnly, deviceLockLimiter, controller.getUsersWithOverdueEmis);

// Admin: Send lock command (matches Flutter API structure)
router.post('/devices/:userId/lock', auth, adminOnly, deviceLockLimiter, controller.sendLockCommand);

// Admin: Send unlock command (matches Flutter API structure)
router.post('/devices/:userId/unlock', auth, adminOnly, deviceLockLimiter, controller.sendUnlockCommand);

// Admin: Extend payment (matches Flutter API structure)
router.post('/devices/:userId/extend-payment', auth, adminOnly, deviceLockLimiter, controller.sendExtendPayment);

// Manual trigger for device lock cron (no auth, no secret key needed)
router.get('/trigger-cron', controller.triggerDeviceLockCron);

module.exports = router;
