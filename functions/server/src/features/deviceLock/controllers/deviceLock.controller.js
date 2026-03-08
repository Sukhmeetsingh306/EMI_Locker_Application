const { success, failure } = require('../../../core/response');
const DeviceLockRequest = require('../models/deviceLock.model');
const ClientUser = require('../../users/models/user.model');
const UserDevice = require('../../users/models/userDevice.model');
const EMI = require('../../emi/models/emi.model');
const EMIPayment = require('../../emi/models/emi.payment.model');
const deviceLockService = require('../services/deviceLock.service');
const { runDeviceLockCron } = require('../../../../scripts/cron');
const fcmService = require('../../../utils/fcm');
const logger = require('../../../config/logger');

// CLIENT → Check lock status
exports.getMyLockStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await ClientUser.findById(userId);
    if (!user) return failure(res, 'User not found', 404);

    const userDevice = await UserDevice.findOne({ userId });
    const deviceLocked = userDevice ? userDevice.deviceLocked : false;

    const pendingLock = await DeviceLockRequest.findOne({
      userId,
      processed: false,
    }).sort({ createdAt: -1 });

    return success(
      res,
      {
        data: {
          deviceLocked,
          pendingLock: !!pendingLock,
        },
      },
      'Lock status fetched'
    );
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// ADMIN → Get users with overdue EMIs
exports.getUsersWithOverdueEmis = async (req, res) => {
  try {
    const adminId = req.user.id; // Get from authenticated user
    const result = await deviceLockService.getUsersWithOverdueEmis(adminId, req.query);
    return success(res, result, 'Users with overdue EMIs fetched');
  } catch (err) {
    console.error('Error in getUsersWithOverdueEmis:', err);
    return failure(res, err.message, 500);
  }
};

/**
 * ADMIN → Send Lock Command (matches Flutter API structure)
 * POST /api/device-lock/devices/:userId/lock
 */
exports.sendLockCommand = async (req, res) => {
  try {
    const { userId } = req.params;
    const lockData = req.body || {};

    // Get user and device info
    const user = await ClientUser.findById(userId);
    if (!user) {
      return failure(res, 'User not found', 404);
    }

    const userDevice = await UserDevice.findOne({ userId });
    if (!userDevice || !userDevice.fcmToken) {
      return failure(res, 'FCM token not found for user', 400);
    }

    // Get EMI info if emiId is provided
    let emi = null;
    if (lockData.emiId) {
      emi = await EMI.findById(lockData.emiId);
    } else {
      // Get first active EMI
      emi = await EMI.findOne({ user: userId, status: 'active' });
    }

    // Calculate overdue amount if not provided
    let overdueAmount = lockData.overdueAmount || 0;
    if (!lockData.overdueAmount && emi) {
      const installmentAmount = emi.totalAmount / emi.totalInstallments;
      const unpaidInstallments = emi.totalInstallments - emi.paidInstallments;
      overdueAmount = unpaidInstallments * installmentAmount;
    }

    // Send lock command via FCM
    const result = await fcmService.sendLockCommand(userId, {
      fcmToken: userDevice.fcmToken,
      emiId: (emi?._id || lockData.emiId || '').toString(),
      reason: lockData.reason || 'EMI overdue',
      overdueAmount: overdueAmount,
      loanNumber: emi?.billNumber || lockData.loanNumber || '',
      borrowerName: user.fullName || lockData.borrowerName || '',
    });

    // Lock the device in database
    await UserDevice.findOneAndUpdate(
      { userId },
      { deviceLocked: true },
      { upsert: true, new: true }
    );

    await DeviceLockRequest.create({
      userId,
      emiId: emi?._id || null,
    });

    return success(res, {
      userId,
      messageId: result.messageId,
      sentAt: result.sentAt,
    }, 'Lock command sent successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * ADMIN → Send Unlock Command (matches Flutter API structure)
 * POST /api/admin/devices/:userId/unlock
 */
exports.sendUnlockCommand = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};

    // Get user and device info
    const user = await ClientUser.findById(userId);
    if (!user) {
      return failure(res, 'User not found', 404);
    }

    const userDevice = await UserDevice.findOne({ userId });
    if (!userDevice || !userDevice.fcmToken) {
      return failure(res, 'FCM token not found for user', 400);
    }

    // Send unlock command via FCM
    const result = await fcmService.sendUnlockCommand(userId, {
      fcmToken: userDevice.fcmToken,
      reason: reason || 'Payment received',
    });

    // Unlock the device in database
    await UserDevice.findOneAndUpdate(
      { userId },
      { deviceLocked: false },
      { upsert: true, new: true }
    );

    await DeviceLockRequest.updateMany(
      { userId },
      { processed: true }
    );

    return success(res, {
      userId,
      messageId: result.messageId,
      sentAt: result.sentAt,
    }, 'Unlock command sent successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * ADMIN → Extend Payment (matches Flutter API structure)
 * POST /api/admin/devices/:userId/extend-payment
 */
exports.sendExtendPayment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days, reason } = req.body;

    if (!days || days <= 0) {
      return failure(res, 'Valid number of days is required', 400);
    }

    // Get user and device info
    const user = await ClientUser.findById(userId);
    if (!user) {
      return failure(res, 'User not found', 404);
    }

    const userDevice = await UserDevice.findOne({ userId });
    if (!userDevice || !userDevice.fcmToken) {
      return failure(res, 'FCM token not found for user', 400);
    }

    // Send extend payment command via FCM
    const result = await fcmService.sendExtendPayment(
      userId,
      days,
      reason || 'Payment extension granted',
      userDevice.fcmToken
    );

    // Update payment extendDays in database (update the next pending payment)
    const nextPayment = await EMIPayment.findOne({
      userId,
      status: 'pending',
    }).sort({ dueDate: 1 });

    if (nextPayment) {
      nextPayment.extendDays = (nextPayment.extendDays || 0) + days;
      nextPayment.extendReason = reason || 'Payment extension granted';
      nextPayment.extendedBy = req.user.id;
      nextPayment.extendedOn = new Date();
      await nextPayment.save();
    }

    return success(res, {
      userId,
      days,
      unlockUntil: result.unlockUntil,
      messageId: result.messageId,
      sentAt: result.sentAt,
    }, 'Payment extension sent successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Manual trigger for device lock cron (no auth required, uses secret key via query parameter)
// This is a backup trigger in case the scheduled cron doesn't run
exports.triggerDeviceLockCron = async (req, res) => {
  try {
    // Secret key check via query parameter (handle URL decoding safely)
    let secretKey = req.query.secret || null;
    
    // Try to decode if it exists, but don't fail if decoding fails
    if (secretKey) {
      try {
        secretKey = decodeURIComponent(secretKey);
      } catch (decodeError) {
        // If decoding fails, use the original value
        secretKey = req.query.secret;
      }
    }
    
    const expectedSecret = process.env.CRON_SECRET_KEY || '432cron_trigger';

    if (!secretKey || secretKey !== expectedSecret) {
      return failure(res, 'Unauthorized: Invalid secret key', 401);
    }

    const result = await runDeviceLockCron();
    return success(res, result, 'Device lock cron executed successfully');
  } catch (err) {
    return failure(res, err.message, 500);
  }
};
