const { success, failure } = require('../../../core/response');
const agentService = require('../services/agentManagement.service');
const adminService = require('../../admins/services/adminManagement.service');
const Admin = require('../../admins/models/admin.model');
const KeyPrice = require('../../keyPrices/models/keyPrice.model');

// CREATE AGENT
exports.createAgent = async (req, res) => {
  try {
    const superAdminId = req.user.id; // Super admin creating the agent
    const agent = await agentService.createAgent(req.body, superAdminId);
    return success(res, { data: agent }, "Agent created successfully", 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// LIST AGENTS
exports.getAgents = async (req, res) => {
  try {
    const result = await agentService.getAgents(req.query);
    return success(res, result, "Agents fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// GET SINGLE AGENT
exports.getAgentById = async (req, res) => {
  try {
    const agent = await agentService.getAgentById(req.params.id);
    if (!agent) return failure(res, "Agent not found", 404);
    return success(res, { data: agent }, "Agent fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT CREATE ADMIN
exports.createAdminByAgent = async (req, res) => {
  try {
    const agentId = req.user.id; // Agent creating the admin
    const admin = await adminService.createAdmin(req.body, null, agentId);
    return success(res, { data: admin }, "Admin created successfully", 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT GET ADMINS (only admins enrolled under this agent)
exports.getAdminsByAgent = async (req, res) => {
  try {
    const agentId = req.user.id;
    // Filter admins by enrolledBy = agentId
    const result = await adminService.getAdmins({ ...req.query, enrolledBy: agentId });
    return success(res, result, "Agent's admins fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT GET SINGLE ADMIN
exports.getAdminByIdByAgent = async (req, res) => {
  try {
    const agentId = req.user.id;
    const adminId = req.params.id;
 
    const admin = await adminService.getAdminById(adminId);
    if (!admin) return failure(res, "Admin not found", 404);
    
    // Check if this admin belongs to the agent
    if (admin.enrolledBy?._id?.toString() !== agentId) {
      return failure(res, "Unauthorized to access this admin", 403);
    }
    
    return success(res, { data: admin }, "Admin fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT UPDATE ADMIN
exports.updateAdminByAgent = async (req, res) => {
  try {
    const agentId = req.user.id;
    const adminId = req.params.id;
    
    // First check if admin exists and belongs to agent
    const admin = await adminService.getAdminById(adminId);
    if (!admin) return failure(res, "Admin not found", 404);
    
    if (admin.enrolledBy?._id?.toString() !== agentId) {
      return failure(res, "Unauthorized to update this admin", 403);
    }
    
    const updatedAdmin = await adminService.updateAdmin(adminId, req.body);
    return success(res, { data: updatedAdmin }, "Admin updated successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT GET ADMIN STATS (user count, keys, etc.)
exports.getAdminStatsByAgent = async (req, res) => {
  try {
    const agentId = req.user.id;
    const adminId = req.params.id;
    
    const admin = await adminService.getAdminById(adminId);
    if (!admin) return failure(res, "Admin not found", 404);
    if (admin.enrolledBy?._id?.toString() !== agentId) {
      return failure(res, "Unauthorized to access this admin", 403);
    }
    
    // Get detailed stats for the admin
    const stats = await adminService.getAdminDetailedStats(adminId);
    return success(res, { data: stats }, "Admin stats fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT GET DASHBOARD OVERVIEW
exports.getAgentDashboard = async (req, res) => {
  try {
    const agentId = req.user.id;
    
    // Get agent's admins with detailed breakdown
    const result = await adminService.getAdmins({ enrolledBy: agentId, includeStats: true });

    // Get additional stats from the admin data
    const admins = result.data || [];
    const activeAdmins = admins.filter(admin => admin.status === 1).length;
    const blockedAdmins = admins.filter(admin => admin.status === 0).length;
    const totalAdmins = activeAdmins+blockedAdmins;
    
    // Calculate aggregate stats
    const totalUsers = admins.reduce((sum, admin) => sum + (admin.stats?.usersCreated || 0), 0);
    const totalKeys = admins.reduce((sum, admin) => sum + (admin.stats?.keyStats?.totalKeys || 0), 0);
    const usedKeys = admins.reduce((sum, admin) => sum + (admin.stats?.keyStats?.usedKeys || 0), 0);
    const availableKeys = admins.reduce((sum, admin) => sum + (admin.stats?.keyStats?.availableKeys || 0), 0);
    
    const overview = {
      totalAdmins,
      activeAdmins,
      blockedAdmins,
      aggregateStats: {
        totalUsers,
        totalKeys,
        usedKeys,
        availableKeys,
      }
    };
    
    return success(res, { data: overview }, "Agent dashboard overview fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT GET PROFILE
exports.getAgentProfile = async (req, res) => {
  try {
    const agentId = req.user.id;
    const agent = await agentService.getAgentById(agentId);
    if (!agent) return failure(res, "Agent not found", 404);
    return success(res, { data: agent }, "Agent profile fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT REQUEST CASH DEPOSIT
exports.requestCashDeposit = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { adminId, keyPriceId, notes } = req.body;

    if (!adminId || !keyPriceId) {
      return failure(res, 'Admin ID and Key Price ID are required', 400);
    }

    // Get admin details
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return failure(res, 'Admin not found', 404);
    }

    // Get key price details
    const keyPrice = await KeyPrice.findById(keyPriceId);
    if (!keyPrice) {
      return failure(res, 'Key price not found', 404);
    }

    // Create KeyPackage entry (same as razorpay flow)
    const KeyPackage = require('../../keyPackages/models/keyPackage.model');
    const keyPackage = await KeyPackage.create({
      admin: adminId,
      keyPrice: keyPriceId,
      packageType: keyPrice.keys?.toString()
    });

    // Create cash deposit request
    const CashDeposit = require('../../paymentTransactions/models/cashDeposit.model');
    const depositRequest = await CashDeposit.create({
      agent: agentId,
      admin: adminId,
      keyPrice: keyPriceId,
      amount: keyPrice.price,
      notes: notes || 'Cash deposit request',
      status: 'pending'
    });

    // Create PackagePaymentTransaction entry for cash deposit (same as razorpay flow)
    const PackagePaymentTransaction = require('../../paymentTransactions/models/packagePaymentTransaction.model');
    const transaction = await PackagePaymentTransaction.create({
      admin: adminId,
      keyPackage: keyPackage._id,
      keyPrice: keyPriceId,
      amount: keyPrice.price,
      status: 'pending',
      paymentMethod: 'cash',
      transactionId: `CASH_${depositRequest._id}`,
      notes: 'Cash deposit request - pending approval'
    });

    // Populate response data
    const populatedDeposit = await CashDeposit.findById(depositRequest._id)
      .populate('agent', 'name email mobile')
      .populate('admin', 'name email mobile')
      .populate('keyPrice', 'packageName keys price');

    return success(res, { 
      data: populatedDeposit,
      keyPackage: keyPackage,
      transaction: transaction
    }, 'Cash deposit request submitted successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// AGENT GET CASH DEPOSIT TRANSACTIONS
exports.getCashDeposits = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { page, limit, skip } = require('../../../utils/pagination').parsePagination(req.query);
    const { parseSort } = require('../../../utils/pagination');
    
    // Get cash deposits for this agent
    const CashDeposit = require('../../paymentTransactions/models/cashDeposit.model');
    const Admin = require('../../admins/models/admin.model');
    
    // Get all admin IDs enrolled under this agent
    const agentAdmins = await Admin.find({ enrolledBy: agentId }).select('_id').lean();
    const adminIds = agentAdmins.map(admin => admin._id);
    
    // Build filters
    const filters = {
      agent: agentId,
      admin: { $in: adminIds },
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
      .populate('admin', 'name email')
      .populate('keyPrice', 'packageName keys price')
      .lean();
    
    const { buildPaginationResponse } = require('../../../utils/pagination');
    return success(res, buildPaginationResponse(deposits, total, page, limit), "Cash deposits fetched");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// UPDATE AGENT
exports.updateAgent = async (req, res) => {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.body);
    return success(res, { data: agent }, "Agent updated");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// BLOCK AGENT
exports.blockAgent = async (req, res) => {
  try {
    const agent = await agentService.blockAgent(req.params.id);
    return success(res, { data: agent }, "Agent blocked successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// UNBLOCK AGENT
exports.unblockAgent = async (req, res) => {
  try {
    const agent = await agentService.unblockAgent(req.params.id);
    return success(res, { data: agent }, "Agent unblocked successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// DELETE AGENT (blocks instead of deleting)
exports.deleteAgent = async (req, res) => {
  try {
    const agent = await agentService.blockAgent(req.params.id);
    return success(res, { data: agent }, "Agent blocked successfully");
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

