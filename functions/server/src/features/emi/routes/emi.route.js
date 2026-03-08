const express = require('express');
const controller = require('../controllers/emi.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const clientOnly = require('../../../middlewares/client.middleware');
const { adminLimiter, clientLimiter } = require('../../../middlewares/rateLimiter');

const router = express.Router();

// Client self-service EMIs - apply client rate limiting
router.get('/my', auth, clientOnly, clientLimiter, controller.listMyEmis);
router.get('/my/:emiId', auth, clientOnly, clientLimiter, controller.getMyEmi);
router.get('/my/:emiId/payments', auth, clientOnly, clientLimiter, controller.getMyEmiPayments);

// Admin creates EMIs and views all
router.post('/', auth, adminOnly, adminLimiter, controller.createEmi);
router.get('/', auth, adminOnly, adminLimiter, controller.listEmis);
router.get('/:id', auth, adminOnly, adminLimiter, controller.getEmi);
router.get('/:id/payments', auth, adminOnly, adminLimiter, controller.getEmiPayments);

module.exports = router;
