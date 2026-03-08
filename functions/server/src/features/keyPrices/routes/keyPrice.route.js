const router = require('express').Router();
const controller = require('../controllers/keyPrice.controller');
const auth = require('../../../middlewares/auth.middleware');
const superadmin = require('../../../middlewares/superadmin.middleware');
const { adminLimiter } = require('../../../middlewares/rateLimiter');

// Apply admin rate limiting to all key price routes
router.use(adminLimiter);

// Get active key prices (public for admins to see available packages)
router.get('/active', auth, controller.getActiveKeyPrices);

// All other routes require superadmin
router.get('/', auth, superadmin, controller.getAllKeyPrices);
router.get('/:id', auth, superadmin, controller.getKeyPriceById);
router.post('/', auth, superadmin, controller.createKeyPrice);
router.put('/:id', auth, superadmin, controller.updateKeyPrice);
router.delete('/:id', auth, superadmin, controller.deleteKeyPrice);

module.exports = router;

