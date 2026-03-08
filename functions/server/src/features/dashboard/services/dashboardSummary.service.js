const Admin = require('../../admins/models/admin.model');
const KeyPackage = require('../../keyPackages/models/keyPackage.model');
const PackagePaymentTransaction = require('../../paymentTransactions/models/packagePaymentTransaction.model');
const ClientUser = require('../../users/models/user.model');
const EMI = require('../../emi/models/emi.model');
const EMIPayment = require('../../emi/models/emi.payment.model');
const DeviceLockRequest = require('../../deviceLock/models/deviceLock.model');
const UserDevice = require('../../users/models/userDevice.model');

// Lightweight dashboard summary - only counts, no full data
exports.getDashboardSummary = async () => {
  // Use aggregation for better performance
  const [
    adminCounts,
    packageStats,
    totalUsers
  ] = await Promise.all([
    // Admin counts using aggregation
    Admin.aggregate([
      {
        $facet: {
          totalAdmins: [
            { $match: { role: 'admin' } },
            { $count: 'count' }
          ],
          activeAdmins: [
            { $match: { role: 'admin', status: 1 } },
            { $count: 'count' }
          ],
          blockedAdmins: [
            { $match: { role: 'admin', status: 0 } },
            { $count: 'count' }
          ],
          totalSuperAdmins: [
            { $match: { role: 'superadmin' } },
            { $count: 'count' }
          ]
        }
      }
    ]),
    // Package stats using payment transactions (authoritative payment record)
    PackagePaymentTransaction.aggregate([
      {
        $facet: {
          totalPackages: [
            { $count: 'count' }
          ],
          completedPackages: [
            { $match: { status: 'completed' } },
            { $count: 'count' }
          ],
          totalRevenue: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]
        }
      }
    ]),
    // Total users count
    ClientUser.countDocuments()
  ]);

  // Extract counts from aggregation results
  const adminStats = adminCounts[0] || {};
  const packageStatsData = packageStats[0] || {};

  return {
    totalAdmins: adminStats.totalAdmins?.[0]?.count || 0,
    activeAdmins: adminStats.activeAdmins?.[0]?.count || 0,
    blockedAdmins: adminStats.blockedAdmins?.[0]?.count || 0,
    totalSuperAdmins: adminStats.totalSuperAdmins?.[0]?.count || 0,
    totalPackages: packageStatsData.totalPackages?.[0]?.count || 0,
    completedPackages: packageStatsData.completedPackages?.[0]?.count || 0,
    totalPackageRevenue: packageStatsData.totalRevenue?.[0]?.total || 0,
    totalUsers: totalUsers || 0
  };
};

// Get admin-specific dashboard stats
exports.getAdminDashboardStats = async (adminId) => {
  // Get admin details
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  // Get all user IDs created by this admin
  const userIds = await ClientUser.find({ createdBy: adminId }).select('_id').lean();
  const userIdArray = userIds.map(u => u._id);

  // Get active EMI users count (users with at least one active EMI)
  const activeEmiUsers = await EMI.distinct('user', {
    user: { $in: userIdArray },
    status: 'active'
  });

  // Get today's date in IST for proper date calculations
  // IST is UTC+5:30
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const nowUTC = new Date();
  const istNow = new Date(nowUTC.getTime() + IST_OFFSET_MS);
  const todayISTYear = istNow.getUTCFullYear();
  const todayISTMonth = istNow.getUTCMonth();
  const todayISTDate = istNow.getUTCDate();
  
  // Today's date in IST as stored in DB (calendar-selected format: YYYY-MM-DD 00:00:00 UTC)
  const todayISTAsUTC = new Date(Date.UTC(todayISTYear, todayISTMonth, todayISTDate, 0, 0, 0, 0));
  const tomorrow = new Date(Date.UTC(todayISTYear, todayISTMonth, todayISTDate + 1, 0, 0, 0, 0));
  
  // For paidDate: it's stored as actual UTC timestamp when payment was made
  // So we need IST date range converted to UTC
  const getStartOfTodayIST = () => {
    const prevDayUTC = new Date(Date.UTC(todayISTYear, todayISTMonth, todayISTDate, 0, 0, 0, 0));
    prevDayUTC.setUTCDate(prevDayUTC.getUTCDate() - 1);
    prevDayUTC.setUTCHours(18, 30, 0, 0);
    return prevDayUTC;
  };
  
  const todayUTCStart = getStartOfTodayIST(); // Start of today in IST (as UTC)
  const tomorrowISTStart = new Date(todayUTCStart.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours

  // Get today's payment count and total amount (paid today in IST)
  const todayPaymentsData = await EMIPayment.aggregate([
    {
      $match: {
        userId: { $in: userIdArray },
        status: 'paid',
        paidDate: { 
          $exists: true,
          $ne: null,
          $gte: todayUTCStart, 
          $lt: tomorrowISTStart 
        }
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const todayPayments = todayPaymentsData[0]?.count || 0;
  const totalPaymentToday = todayPaymentsData[0]?.totalAmount || 0;

  // Get users with overdue EMIs (dueDate <= today, including due today)
  // Get unique user IDs with overdue payments (no need to populate, just get distinct user IDs)
  const overdueUserIds = await EMIPayment.distinct('userId', {
    userId: { $in: userIdArray },
    dueDate: { $lt: tomorrow },
    status: { $in: ['pending', 'overdue'] }
  });
  
  // Count unique users with overdue EMIs
  const devicesToLockCount = overdueUserIds.length;

  // Get total pending payments till today (dueDate <= today, including today)
  // This counts all pending/overdue payments, not just unique users
  const totalPendingPaymentsData = await EMIPayment.aggregate([
    {
      $match: {
        userId: { $in: userIdArray },
        status: { $in: ['pending', 'overdue'] },
        dueDate: { $lt: tomorrow } // Less than tomorrow = today or before (includes today)
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const totalPendingPaymentsTillToday = totalPendingPaymentsData[0]?.count || 0;
  const totalPendingAmountTillToday = totalPendingPaymentsData[0]?.totalAmount || 0;

  // Get total count of locked devices for this admin's users
  const deviceLockedCount = await UserDevice.countDocuments({
    userId: { $in: userIdArray },
    deviceLocked: true
  });

  return {
    keysLeft: admin.availableKeys || 0,
    totalKeys: admin.totalKeys || 0,
    usedKeys: admin.usedKeys || 0,
    activeEmiUsersCount: activeEmiUsers.length,
    todayPayments: todayPayments,
    totalPaymentToday: totalPaymentToday,
    devicesToLockCount: devicesToLockCount,
    deviceLockedCount: deviceLockedCount,
    totalUsers: userIdArray.length,
    totalPendingPaymentsTillToday: totalPendingPaymentsTillToday,
    totalPendingAmountTillToday: totalPendingAmountTillToday
  };
};

// Get total pending payments till today (standalone endpoint)
exports.getTotalPendingPayments = async (adminId) => {
  // Get admin details
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  // Get all user IDs created by this admin
  const userIds = await ClientUser.find({ createdBy: adminId }).select('_id').lean();
  const userIdArray = userIds.map(u => u._id);

  if (userIdArray.length === 0) {
    return {
      totalPendingPaymentsTillToday: 0,
      totalPendingAmountTillToday: 0
    };
  }

  // Get today's date in IST for proper date calculations
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const nowUTC = new Date();
  const istNow = new Date(nowUTC.getTime() + IST_OFFSET_MS);
  const todayISTYear = istNow.getUTCFullYear();
  const todayISTMonth = istNow.getUTCMonth();
  const todayISTDate = istNow.getUTCDate();
  
  // Tomorrow's date for $lt comparison (includes today)
  const tomorrow = new Date(Date.UTC(todayISTYear, todayISTMonth, todayISTDate + 1, 0, 0, 0, 0));

  // Get total pending payments till today (dueDate <= today, including today)
  const totalPendingPaymentsData = await EMIPayment.aggregate([
    {
      $match: {
        userId: { $in: userIdArray },
        status: { $in: ['pending', 'overdue'] },
        dueDate: { $lt: tomorrow } // Less than tomorrow = today or before (includes today)
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  return {
    totalPendingPaymentsTillToday: totalPendingPaymentsData[0]?.count || 0,
    totalPendingAmountTillToday: totalPendingPaymentsData[0]?.totalAmount || 0
  };
};

