const Admin = require('../../admins/models/admin.model');
const KeyPackage = require('../../keyPackages/models/keyPackage.model');
const PackagePaymentTransaction = require('../../paymentTransactions/models/packagePaymentTransaction.model');
const ClientUser = require('../../users/models/user.model');

exports.getAdminDetailedStats = async (adminId) => {
  const admin = await Admin.findById(adminId).populate('createdBy', 'name email');
  if (!admin) throw new Error('Admin not found');

  // Get all packages
  const packages = await KeyPackage.find({ admin: adminId })
    .populate('keyPrice')
    .sort({ createdAt: -1 });
  // Get all users created
  const users = await ClientUser.find({ createdBy: adminId })
    .select('fullName email mobile createdAt')
    .sort({ createdAt: -1 });

  const transactions = await PackagePaymentTransaction.find({ admin: adminId, status: 'completed' });

  return {
    admin,
    packages,
    users,
    summary: {
      totalPackages: packages.length,
      completedPackages: transactions.length,
      totalPackageAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      totalUsers: users.length
    }
  };
};

