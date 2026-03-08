const { success, failure } = require('../../../core/response');
const adminService = require('../services/adminManagement.service');

// CREATE ADMIN / SUPERADMIN
exports.createAdmin = async (req, res) => {
  try {
    const creatorId = req.user.id; // User creating the admin (could be super admin or agent)
    const creatorRole = req.user.role; // Role of the creator
    const { agentId } = req.body; // Optional agent ID for enrollment (only used by super admin)
    
    let admin;
    if (creatorRole === 'superadmin') {
      // Super admin creating admin
      admin = await adminService.createAdmin(req.body, creatorId, agentId || null);
    } else if (creatorRole === 'agent') {
      // Agent creating admin - agent is both creator and enroller
      admin = await adminService.createAdmin(req.body, null, creatorId);
    } else {
      return failure(res, "Unauthorized to create admin", 403);
    }
    
    return success(res, { data: admin }, "Admin created with 5 free keys", 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// LIST ADMINS
exports.getAdmins = async (req, res) => {
  try {
    const result = await adminService.getAdmins(req.query);
    return success(res, result, "Admins fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// GET SINGLE ADMIN
exports.getAdminById = async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.params.id);
    if (!admin) return failure(res, "Admin not found", 404);
    return success(res, { data: admin }, "Admin fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// UPDATE ADMIN
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await adminService.updateAdmin(req.params.id, req.body);
    return success(res, { data: admin }, "Admin updated");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// BLOCK ADMIN (instead of delete)
exports.blockAdmin = async (req, res) => {
  try {
    const admin = await adminService.blockAdmin(req.params.id);
    return success(res, { data: admin }, "Admin blocked successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// UNBLOCK ADMIN
exports.unblockAdmin = async (req, res) => {
  try {
    const admin = await adminService.unblockAdmin(req.params.id);
    return success(res, { data: admin }, "Admin unblocked successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// DELETE ADMIN (now blocks instead of deleting)
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await adminService.blockAdmin(req.params.id);
    return success(res, { data: admin }, "Admin blocked successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// GET CURRENT ADMIN PROFILE (with key info)
exports.getMyProfile = async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.user.id);
    if (!admin) return failure(res, "Admin not found", 404);
    return success(res, { data: admin }, "Profile fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// GET CASH DEPOSITS FOR ADMIN
exports.getCashDeposits = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { page, limit, skip } = require('../../../utils/pagination').parsePagination(req.query);
    const { parseSort } = require('../../../utils/pagination');
    
    // Get cash deposits for this admin
    const CashDeposit = require('../../paymentTransactions/models/cashDeposit.model');
    
    // Build filters
    const filters = {
      admin: adminId,
      type: 'cash_deposit_request'
    };
    
    // Status filter
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Date range filters
    if (req.query.dateFrom) {
      filters.requestedAt = { ...filters.requestedAt, $gte: new Date(req.query.dateFrom) };
    }
    if (req.query.dateTo) {
      filters.requestedAt = { ...filters.requestedAt, $lte: new Date(req.query.dateTo) };
    }
    
    // Get total count
    const total = await CashDeposit.countDocuments(filters);
    
    // Get paginated data
    const sort = parseSort(req.query, 'requestedAt', 'desc');
    const deposits = await CashDeposit.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('agent', 'name email mobile')
      .populate('keyPrice', 'packageName price keys description')
      .lean();
    
    const { buildPaginationResponse } = require('../../../utils/pagination');
    return success(res, buildPaginationResponse(deposits, total, page, limit), "Cash deposits fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// UPDATE OWN PROFILE (admin can update their own data)
exports.updateMyProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await adminService.updateMyProfile(adminId, req.body);
    return success(res, { data: admin }, "Profile updated successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// TRANSFER ADMIN TO ANOTHER AGENT
exports.transferAdmin = async (req, res) => {
  try {
    const { adminId, newAgentId } = req.body;
    const admin = await adminService.transferAdmin(adminId, newAgentId);
    return success(res, { data: admin }, "Admin transferred successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// SUPERADMIN GET ALL CASH DEPOSIT REQUESTS
exports.getAllCashDeposits = async (req, res) => {
  try {
    const { page, limit, skip } = require('../../../utils/pagination').parsePagination(req.query);
    const { parseSort } = require('../../../utils/pagination');
    
    // Get all cash deposits
    const CashDeposit = require('../../paymentTransactions/models/cashDeposit.model');
    
    // Build filters
    const filters = {
      type: 'cash_deposit_request'
    };
    
    // Status filter
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    // Agent filter
    if (req.query.agentId) {
      filters.agent = req.query.agentId;
    }
    
    // Admin filter
    if (req.query.adminId) {
      filters.admin = req.query.adminId;
    }
    
    // Date range filters
    if (req.query.dateFrom) {
      filters.requestedAt = { ...filters.requestedAt, $gte: new Date(req.query.dateFrom) };
    }
    if (req.query.dateTo) {
      filters.requestedAt = { ...filters.requestedAt, $lte: new Date(req.query.dateTo) };
    }
    
    // Get total count
    const total = await CashDeposit.countDocuments(filters);
    
    // Get paginated data
    const sort = parseSort(req.query, 'requestedAt', 'desc');
    const deposits = await CashDeposit.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('agent', 'name email mobile')
      .populate('admin', 'name email mobile')
      .populate('keyPrice', 'packageName price keys description')
      .lean();
    
    const { buildPaginationResponse } = require('../../../utils/pagination');
    return success(res, buildPaginationResponse(deposits, total, page, limit), "Cash deposits fetched");
  } catch (err) {
    console.error('ERROR in getAllCashDeposits:', err.message);
    return failure(res, err.message, 400);
  }
};

// SUPERADMIN APPROVE CASH DEPOSIT
exports.approveCashDeposit = async (req, res) => {
console.log('approveCashDeposit called with params:', req.params);
console.log('approveCashDeposit called with body:', req.body);
console.log('User ID:', req.user?.id);
  
try {
const { depositId } = req.params;
const { notes } = req.body || {};

console.log('=== APPROVING CASH DEPOSIT ===');
console.log('Deposit ID:', depositId);

// Find and populate the cash deposit
const CashDeposit = require('../../paymentTransactions/models/cashDeposit.model');
const deposit = await CashDeposit.findById(depositId)
  .populate('admin')
  .populate('keyPrice');

console.log('Found deposit:', deposit?._id, 'Status:', deposit?.status);

if (!deposit) {
  return failure(res, 'Cash deposit not found', 404);
}

if (deposit.status !== 'pending') {
  return failure(res, 'Cash deposit is not pending', 400);
}

    // Update deposit status
    const updatedDeposit = await CashDeposit.findByIdAndUpdate(
      depositId,
      { 
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
        notes: notes || 'Cash deposit approved'
      },
      { new: true }
    ).populate('admin keyPrice');

    console.log('Deposit updated to approved');

    // Find the associated KeyPackage for this cash deposit
    console.log('Looking for KeyPackage with admin:', deposit.admin._id, 'keyPrice:', deposit.keyPrice._id);
    const KeyPackage = require('../../keyPackages/models/keyPackage.model');
    const keyPackage = await KeyPackage.findOne({
      admin: deposit.admin._id,
      keyPrice: deposit.keyPrice._id
    }).sort({ createdAt: -1 });

    console.log('Found KeyPackage:', keyPackage?._id);

    if (!keyPackage) {
      console.log('ERROR: Associated package not found');
      return failure(res, 'Associated package not found', 404);
    }

    // Complete the package purchase using the same service as razorpay
    console.log('Calling completePackagePurchase for package:', keyPackage._id);
    const keyPackageService = require('../../keyPackages/services/keyPackage.service');
    const { keyPackage: completedPackage, transaction } = await keyPackageService.completePackagePurchase(keyPackage._id, {
      transactionId: `CASH_${depositId}`,
      approvedBy: req.user.id
    });

    console.log('Package completed successfully');
    console.log('=== CASH DEPOSIT APPROVED ===');

    return success(res, { 
      data: updatedDeposit,
      keyPackage: completedPackage,
      transaction: transaction
    }, 'Cash deposit approved and package completed successfully');
  } catch (err) {
    console.error('ERROR in approveCashDeposit:', err.message);
    console.error('Full error:', err);
    return failure(res, err.message, 400);
  }
};

// SUPERADMIN REJECT CASH DEPOSIT
exports.rejectCashDeposit = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const { depositId } = req.params;
    const { notes } = req.body; // Optional rejection notes
    
    // Get cash deposit
    const CashDeposit = require('../../paymentTransactions/models/cashDeposit.model');
    const deposit = await CashDeposit.findById(depositId);
    
    if (!deposit) {
      return failure(res, "Cash deposit not found", 404);
    }
    
    if (deposit.status !== 'pending') {
      return failure(res, "Cash deposit is not in pending status", 400);
    }
    
    // Update deposit status
    const updatedDeposit = await CashDeposit.findByIdAndUpdate(
      depositId,
      {
        status: 'rejected',
        processedAt: new Date(),
        processedBy: superAdminId,
        notes: notes || ''
      },
      { new: true }
    ).populate('agent', 'name email mobile')
     .populate('admin', 'name email mobile')
     .populate('keyPrice', 'packageName price keys description');
    
    // Update existing PackagePaymentTransaction from pending to failed
    const PackagePaymentTransaction = require('../../paymentTransactions/models/packagePaymentTransaction.model');
    await PackagePaymentTransaction.findOneAndUpdate(
      { transactionId: `CASH_${depositId}` },
      { 
        status: 'failed',
        notes: notes || 'Cash deposit rejected'
      }
    );
    
    return success(res, { data: updatedDeposit }, "Cash deposit rejected successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};