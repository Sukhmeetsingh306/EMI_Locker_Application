const express = require('express');
const controller = require('../controllers/auth.controller');
const superadmin = require("../../../middlewares/superadmin.middleware");
const auth = require("../../../middlewares/auth.middleware");
const { authLimiter } = require("../../../middlewares/rateLimiter");

const router = express.Router();

// Admin register (optional – only for first admin or dev use)
// router.post('/register', controller.register);
router.post('/register', auth, superadmin, controller.register);

// Client/User login endpoint - apply strict rate limiting
router.post('/login', authLimiter, controller.login);

// Admin/Superadmin login endpoint - apply strict rate limiting
router.post('/admin/login', authLimiter, controller.adminLogin);

// Agent login endpoint - apply strict rate limiting
router.post('/agent/login', authLimiter, controller.agentLogin);

module.exports = router;
