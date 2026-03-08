// const express = require('express');
// const { authenticate } = require('../../../middlewares/auth');
// const controller = require('../controllers/user.controller');

// const router = express.Router();

// router.get('/me', authenticate, controller.getProfile);

// module.exports = router;


//////////////////////////////



const express = require('express');
const controller = require('../controllers/user.controller');
const auth = require('../../../middlewares/auth.middleware');
const adminOnly = require('../../../middlewares/admin.middleware');
const clientOnly = require('../../../middlewares/client.middleware');
const { userManagementLimiter, clientLimiter } = require('../../../middlewares/rateLimiter');

const router = express.Router();

// Client self-service routes - apply client rate limiting
router.get('/me', auth, clientOnly, clientLimiter, controller.getMyProfile);
router.post('/fcm-token', auth, clientOnly, clientLimiter, controller.registerFcmToken);

// All other user management is admin-only
router.use(auth, adminOnly, userManagementLimiter);

router.post('/', controller.createUser);
router.get('/', controller.listUsers);
router.get('/:id', controller.getUser);
router.delete('/:id', controller.deleteUser);
router.post('/:id/renew-key', controller.renewKey);

module.exports = router;

