// const { StatusCodes } = require('http-status-codes');
// const asyncHandler = require('../../../core/asyncHandler');
// const ApiError = require('../../../core/ApiError');
// const userService = require('../services/user.service');

// const getProfile = asyncHandler(async (req, res) => {
//   const user = await userService.getUserById(req.user._id || req.user.id);
//   if (!user) {
//     throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
//   }
//   res.json({
//     data: user,
//   });
// });

// module.exports = {
//   getProfile,
// };


//////////////////////////////



const { success, failure } = require('../../../core/response');
const userService = require('../services/user.service');
const logger = require('../../../config/logger');

// Client self-service
exports.getMyProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return failure(res, 'User not found', 404);

    return success(res, { data: user }, 'Profile fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Admin endpoints
exports.createUser = async (req, res) => {
  try {
    const payload = req.body;
    const adminId = req.user.id;

    const user = await userService.createUser(payload, adminId);
    return success(res, { data: user }, 'User created successfully', 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await userService.deleteUser(req.params.id);
    if (!user) return failure(res, 'User not found', 404);

    return success(res, {}, 'User deleted successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return failure(res, 'User not found', 404);

    return success(res, { data: user }, 'User fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.listUsers = async (req, res) => {
  try {
    const adminId = req.user?.id || null;
    const adminRole = req.user?.role || null;
    const result = await userService.listUsers(req.query, adminId, adminRole);
    return success(res, result, 'Users fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.renewKey = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await userService.renewKey(id, adminId);
    return success(res, { data: user }, 'Key renewed successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Client endpoint to register/update FCM token
exports.registerFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    logger.info({ userId, fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : null }, 'FCM token registration request received');

    const userDevice = await userService.registerFcmToken(userId, fcmToken);
    
    logger.info({ userId, userDeviceId: userDevice?._id }, 'FCM token registered successfully');
    
    return success(res, { data: userDevice }, 'FCM token registered successfully');
  } catch (err) {
    logger.error({ err: err.message, userId: req.user?.id }, 'Error registering FCM token');
    return failure(res, err.message, 400);
  }
};