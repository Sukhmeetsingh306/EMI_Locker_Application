const cron = require('node-cron');
const logger = require('../src/config/logger');
const EMIPayment = require('../src/features/emi/models/emi.payment.model');
const EMI = require('../src/features/emi/models/emi.model');
const ClientUser = require('../src/features/users/models/user.model');
const UserDevice = require('../src/features/users/models/userDevice.model');
const UserKey = require('../src/features/users/models/userKey.model');
const DeviceLockRequest = require('../src/features/deviceLock/models/deviceLock.model');
const fcmService = require('../src/utils/fcm');

const startOfDay = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const addDays = (d, days) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt;
};

// Runs every day at 00:00 (server time)
// cron.schedule('0 0 * * *', async () => {
//   try {
//     console.log('Cron started: EMI check');

//     const today = startOfDay(new Date());
//     const yesterday = addDays(today, -1);
//     const twoDaysAgo = addDays(today, -2);
//     const tomorrow = addDays(today, 1);

//     // 1) FIRST ALERT (Due Today)
//     const firstAlertPayments = await EMIPayment.find({
//       status: 'pending',
//       dueDate: { $gte: today, $lt: tomorrow },
//       alertSent: false,
//     });

//     for (const p of firstAlertPayments) {
//       p.alertSent = true;
//       await p.save();
//       console.log(`First alert for payment ${p._id}`);
//     }

//     // 2) SECOND ALERT (Due Yesterday)
//     const secondAlertPayments = await EMIPayment.find({
//       status: 'pending',
//       dueDate: { $gte: yesterday, $lt: today },
//       alertSent: true,
//       secondAlertSent: false,
//     });

//     for (const p of secondAlertPayments) {
//       p.secondAlertSent = true;
//       await p.save();
//       console.log(`Second alert for payment ${p._id}`);
//     }

//     // 3) LOCK DEVICE LOGIC (dueDate + extendDays)
//     const lockPayments = await EMIPayment.find({
//       status: 'pending',
//       $expr: {
//         $lte: [
//           "$dueDate",
//           {
//             $subtract: [
//               new Date(),
//               { $multiply: ["$extendDays", 86400000] }
//             ]
//           }
//         ]
//       }
//     }).populate("emiId");

//     for (const p of lockPayments) {
//       const userId = p.userId;
//       const emi = p.emiId;

//       // 3A) Skip locking if user has no active EMIs (all completed)
//       const activeCount = await EMI.countDocuments({
//         user: userId,
//         status: "active"
//       });

//       if (activeCount === 0) {
//         console.log(
//           `Skipped lock for user ${userId} | All EMIs completed`
//         );
//         continue;
//       }

//       // 3B) Apply lock
//       p.status = 'overdue';
//       await p.save();

//       await UserDevice.findOneAndUpdate(
//         { userId },
//         { deviceLocked: true },
//         { upsert: true, new: true }
//       );

//       await DeviceLockRequest.create({
//         userId,
//         emiId: emi._id,
//       });

//       console.log(`Device Lock Request: User ${userId}, EMI ${emi._id}`);
//     }

//     // 4) MARK OVERDUE (Cosmetic)
//     await EMIPayment.updateMany(
//       {
//         status: 'pending',
//         dueDate: { $lt: today }
//       },
//       { status: 'overdue' }
//     );

//     console.log('Cron finished: EMI check');
//   } catch (err) {
//     console.error('Cron error:', err);
//   }
// });

// Key Expiry Cron - Runs every day at 12:00 AM IST
cron.schedule('0 0 * * *', async () => {
  try {
    logger.info('Cron started: Key expiry check');

    const now = new Date();
    logger.debug({ now: now.toISOString() }, 'Checking for expired keys');
    
    // Find all keys that are expired (keyExpiryDate < now) and not already marked as expired
    const expiredKeys = await UserKey.find({
      isExpired: false,
      keyExpiryDate: { $lt: now }
    });

    logger.debug({ count: expiredKeys.length }, 'Found expired keys to process');

    // Mark all expired keys
    if (expiredKeys.length > 0) {
      const updateResult = await UserKey.updateMany(
        {
          isExpired: false,
          keyExpiryDate: { $lt: now }
        },
        {
          $set: { isExpired: true }
        }
      );
      logger.info(
        { 
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount 
        },
        'Marked keys as expired'
      );
    } else {
      logger.info('No keys to expire');
    }

    logger.info('Cron finished: Key expiry check');
  } catch (err) {
    logger.error({ err }, 'Cron error (Key expiry)');
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});

// Device Lock Cron Function - Can be called manually or via cron
// Locks devices when dueDate + extendDays has passed
// Also updates pending payments to overdue status
const runDeviceLockCron = async () => {
  try {
    logger.info('Cron started: Device lock check (dueDate + extendDays)');

    // Get current time in IST (cron runs at 12:00 AM IST)
    const now = new Date();
    // Convert to IST timezone for date calculations
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const nowIST = new Date(now.getTime() + istOffset);
    
    // Get start of today in IST (00:00:00 IST)
    const todayIST = startOfDay(nowIST);
    
    // Convert today to UTC for database queries
    const todayUTC = new Date(todayIST.getTime() - istOffset);

    logger.debug(
      {
        nowIST: nowIST.toISOString(),
        todayIST: todayIST.toISOString(),
        todayUTC: todayUTC.toISOString()
      },
      'Date check - Today in IST and UTC'
    );

    // Step 1: Find all payments where effective due date (dueDate + extendDays) has passed
    // Effective due date = dueDate + (extendDays * 86400000 milliseconds)
    // We need to find payments where: dueDate + extendDays < today
    // Using MongoDB aggregation to calculate effective due date
    const paymentsToLock = await EMIPayment.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $addFields: {
          // Calculate effective due date: dueDate + (extendDays in milliseconds)
          // extendDays defaults to 0 if not set
          effectiveDueDate: {
            $add: [
              '$dueDate',
              {
                $multiply: [
                  { $ifNull: ['$extendDays', 0] },
                  86400000 // milliseconds in a day
                ]
              }
            ]
          }
        }
      },
      {
        $match: {
          // Effective due date has passed (is less than today)
          effectiveDueDate: { $lt: todayUTC }
        }
      }
    ]);

    logger.info(
      { count: paymentsToLock.length },
      'Found payments where effective due date (dueDate + extendDays) has passed'
    );

    // Step 2: Get full payment documents with populated EMI
    const paymentIds = paymentsToLock.map(p => p._id);
    const overduePayments = await EMIPayment.find({
      _id: { $in: paymentIds }
    }).populate('emiId');

    const lockedDevices = new Set();
    const skippedPayments = [];
    const errors = [];
    const updatedPayments = [];

    for (const payment of overduePayments) {
      try {
        const userId = payment.userId;
        const emi = payment.emiId;

        if (!emi) {
          logger.warn({ paymentId: payment._id }, 'Skipping payment: EMI not found');
          skippedPayments.push({ paymentId: payment._id, reason: 'EMI not found' });
          continue;
        }

        // Skip if user has no active EMIs (all completed)
        const activeCount = await EMI.countDocuments({
          user: userId,
          status: "active"
        });

        if (activeCount === 0) {
          logger.info({ userId }, 'Skipped lock: All EMIs completed');
          skippedPayments.push({ userId, reason: 'All EMIs completed' });
          // Still update payment status to overdue
          if (payment.status === 'pending') {
            payment.status = 'overdue';
            await payment.save();
            updatedPayments.push(payment._id);
          }
          continue;
        }

        // Skip if user's key is expired
        const userKey = await UserKey.findOne({ userId });
        if (userKey) {
          const now = new Date();
          const isKeyExpired = userKey.isExpired || (userKey.keyExpiryDate && userKey.keyExpiryDate < now);
          
          if (isKeyExpired) {
            logger.info({ userId, keyExpiryDate: userKey.keyExpiryDate }, 'Skipped lock: User key is expired');
            skippedPayments.push({ userId, reason: 'User key is expired' });
            // Still update payment status to overdue
            if (payment.status === 'pending') {
              payment.status = 'overdue';
              await payment.save();
              updatedPayments.push(payment._id);
            }
            continue;
          }
        }

        // Skip if device is already locked (avoid duplicate lock requests)
        if (lockedDevices.has(userId.toString())) {
          logger.debug({ userId }, 'Skipped duplicate lock');
          // Still update payment status to overdue
          if (payment.status === 'pending') {
            payment.status = 'overdue';
            await payment.save();
            updatedPayments.push(payment._id);
          }
          continue;
        }

        // Update payment status to overdue
        if (payment.status === 'pending') {
          payment.status = 'overdue';
          await payment.save();
          updatedPayments.push(payment._id);
        }

        // Lock the device
        const userDevice = await UserDevice.findOneAndUpdate(
          { userId },
          { deviceLocked: true },
          { upsert: true, new: true }
        );

        // Create device lock request record
        await DeviceLockRequest.create({
          userId,
          emiId: emi._id,
        });

        // Send FCM notification if token exists
        if (userDevice && userDevice.fcmToken) {
          try {
            // Get user info for notification
            const user = await ClientUser.findById(userId).lean();
            
            // Calculate overdue amount
            const installmentAmount = emi.totalAmount / emi.totalInstallments;
            const unpaidInstallments = emi.totalInstallments - emi.paidInstallments;
            const overdueAmount = unpaidInstallments * installmentAmount;

            // Send lock command using new FCM service structure
            const notificationResult = await fcmService.sendLockCommand(userId, {
              fcmToken: userDevice.fcmToken,
              emiId: emi._id.toString(),
              reason: 'EMI overdue',
              overdueAmount: overdueAmount,
              loanNumber: emi.billNumber || '',
              borrowerName: user?.fullName || '',
            });

            if (notificationResult.success) {
              logger.info(
                { userId, paymentId: payment._id, messageId: notificationResult.messageId },
                'FCM lock command sent successfully for device lock'
              );
            } else {
              logger.warn(
                { userId, paymentId: payment._id, error: notificationResult.error },
                'Failed to send FCM lock command for device lock'
              );

              // If token is invalid, remove it
              if (notificationResult.shouldRemoveToken) {
                await UserDevice.findOneAndUpdate(
                  { userId },
                  { fcmToken: null }
                );
                logger.info({ userId }, 'Removed invalid FCM token');
              }
            }
          } catch (fcmError) {
            logger.error(
              { err: fcmError, userId, paymentId: payment._id },
              'Error sending FCM lock command for device lock'
            );
            // Don't fail the entire cron job if FCM fails
          }
        } else {
          logger.debug(
            { userId },
            'No FCM token found for user, skipping notification'
          );
        }

        lockedDevices.add(userId.toString());

        logger.info(
          {
            userId,
            emiId: emi._id,
            paymentId: payment._id,
            dueDate: payment.dueDate,
            extendDays: payment.extendDays || 0
          },
          'Device locked (effective due date has passed)'
        );
      } catch (paymentError) {
        logger.error(
          { err: paymentError, paymentId: payment._id },
          'Error processing payment in device lock cron'
        );
        errors.push({ paymentId: payment._id, error: paymentError.message });
      }
    }

    // Step 3: Update all remaining pending payments to overdue where dueDate < today
    // (This handles payments without extendDays or where extendDays = 0)
    const overdueUpdateResult = await EMIPayment.updateMany(
      {
        status: 'pending',
        dueDate: { $lt: todayUTC }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    logger.info(
      {
        lockedCount: lockedDevices.size,
        updatedPaymentsCount: updatedPayments.length,
        overdueStatusUpdateCount: overdueUpdateResult.modifiedCount,
        skippedCount: skippedPayments.length,
        errorCount: errors.length
      },
      'Cron finished: Device lock check (dueDate + extendDays)'
    );

    if (errors.length > 0) {
      logger.warn({ errors }, 'Some payments had errors during processing');
    }

    return {
      success: true,
      lockedCount: lockedDevices.size,
      updatedPaymentsCount: updatedPayments.length,
      overdueStatusUpdateCount: overdueUpdateResult.modifiedCount,
      skippedCount: skippedPayments.length,
      errorCount: errors.length,
      skippedPayments,
      errors
    };
  } catch (err) {
    logger.error({ err }, 'Cron error (Device lock)');
    throw err;
  }
};

// Schedule the cron job
cron.schedule('0 0 * * *', runDeviceLockCron, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});

// Export the function so it can be called manually
module.exports = {
  runDeviceLockCron
};

logger.info('Cron scheduler initialized');
