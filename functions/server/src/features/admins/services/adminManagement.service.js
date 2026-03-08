const Admin = require('../models/admin.model');
const KeyPackage = require('../../keyPackages/models/keyPackage.model');
const PackagePaymentTransaction = require('../../paymentTransactions/models/packagePaymentTransaction.model');
const ClientUser = require('../../users/models/user.model');
const { parsePagination, buildPaginationResponse, parseFilters, parseSort, buildSearchFilter } = require('../../../utils/pagination');

exports.createAdmin = async (payload, superAdminId = null, agentId = null) => {
  const { name, email, mobile, password, role = 'admin' } = payload;

  const existing = await Admin.findOne({
    $or: [{ email }, { mobile }]
  });

  if (existing) throw new Error("Admin with this email/mobile already exists");

  // Create admin with 5 free keys
  const adminData = {
    name,
    email,
    mobile,
    password,
    role,
    totalKeys: 5,
    availableKeys: 5,
    usedKeys: 0,
    createdBy: superAdminId || agentId, // Can be Super Admin or Agent
    creatorType: superAdminId ? 'Admin' : agentId ? 'Agent' : null,
    enrolledBy: agentId,      // Can be null if created by super admin without agent
    enrolledAt: agentId ? new Date() : null // Set enrollment date only if agent is involved
  };

  const admin = await Admin.create(adminData);

  return admin;
};

exports.getAdmins = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  const includeStats = query.includeStats === 'true' || query.includeStats === true;
  
  // Build filters
  const filters = {};
  
  // Role filter - default to 'admin' if not specified
  if (query.role) {
    filters.role = query.role;
  } else {
    // By default, only show regular admins (not superadmins)
    filters.role = 'admin';
  }
  
  // Status filter - handle both string ('active'/'blocked') and numeric (0/1) values
  if (query.status !== undefined && query.status !== '') {
    if (query.status === 'active') {
      filters.status = 1;
    } else if (query.status === 'blocked') {
      filters.status = 0;
    } else {
      filters.status = parseInt(query.status);
    }
  }
  
  // Search filter
  if (query.search) {
    const searchFilter = buildSearchFilter(query.search, ['name', 'email', 'mobile']);
    Object.assign(filters, searchFilter);
  }
  
  // EnrolledBy (agent) filter - optional for admin dashboard, required for agent endpoints
  if (query.enrolledBy && query.enrolledBy !== '') {
    filters.enrolledBy = query.enrolledBy;
  }
  // Note: We don't return empty result anymore - admin dashboard can show all admins
  // Agent endpoints should enforce enrolledBy requirement at the controller level
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Get total count
  const total = await Admin.countDocuments(filters);
  
  // Get paginated data
  const admins = await Admin.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email mobile')
    .populate('enrolledBy', 'name email mobile')
    .select('-password')
    .lean();
  
    console.log('Sample admin data:', admins.slice(0, 2).map(a => ({
    id: a._id,
    name: a.name,
    enrolledBy: a.enrolledBy,
    createdBy: a.createdBy
  })));
  
  // If stats are requested, calculate them for each admin
  if (includeStats) {
    const adminIds = admins.map(a => a._id);
    
    // Get package stats using payment transactions (authoritative payment info)
    const packageStats = await PackagePaymentTransaction.aggregate([
      { $match: { admin: { $in: adminIds } } },
      {
        $group: {
          _id: '$admin',
          totalPackages: { $sum: 1 },
          completedPackages: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$amount',
                0
              ]
            }
          }
        }
      }
    ]);
    
    // Get user counts using aggregation
    const userCounts = await ClientUser.aggregate([
      { $match: { createdBy: { $in: adminIds } } },
      {
        $group: {
          _id: '$createdBy',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Create lookup maps
    const packageMap = {};
    packageStats.forEach(stat => {
      packageMap[stat._id.toString()] = {
        total: stat.totalPackages,
        completed: stat.completedPackages,
        totalAmount: stat.totalRevenue
      };
    });
    
    const userMap = {};
    userCounts.forEach(stat => {
      userMap[stat._id.toString()] = stat.count;
    });
    
    // Attach stats to admins
    const adminsWithStats = admins.map(admin => ({
      ...admin,
      stats: {
        keyStats: {
          totalKeys: admin.totalKeys || 0,
          usedKeys: admin.usedKeys || 0,
          availableKeys: admin.availableKeys || 0
        },
        packages: packageMap[admin._id.toString()] || {
          total: 0,
          completed: 0,
          totalAmount: 0
        },
        usersCreated: userMap[admin._id.toString()] || 0
      }
    }));
    
    return buildPaginationResponse(adminsWithStats, total, page, limit);
  }
  
  return buildPaginationResponse(admins, total, page, limit);
};

exports.getAdminById = async (id) => {
  return Admin.findById(id)
    .populate('createdBy', 'name email mobile')
    .populate('enrolledBy', 'name email mobile');
};

exports.updateAdmin = async (id, payload) => {
  return Admin.findByIdAndUpdate(id, payload, { new: true });
};

exports.blockAdmin = async (id) => {
  const admin = await Admin.findByIdAndUpdate(id, { status: 0 }, { new: true });
  if (!admin) throw new Error("Admin not found");
  return admin;
};

exports.unblockAdmin = async (id) => {
  const admin = await Admin.findByIdAndUpdate(id, { status: 1 }, { new: true });
  if (!admin) throw new Error("Admin not found");
  return admin;
};

// Keep delete for backward compatibility, but it now blocks instead
exports.deleteAdmin = async (id) => {
  return exports.blockAdmin(id);
};

// UPDATE OWN PROFILE (admin can update their own data)
exports.updateMyProfile = async (adminId, payload) => {
  // Fields that admins are allowed to update themselves
  const allowedFields = [
    'name',
    'email',
    'mobile',
    'password',
    'razorpayEnabled',
    'qrCodeEnabled',
    'upiId',
    'razorpayKeyId',
    'razorpayKeySecret',
    'superAdminRazorpayId'
  ];

  // Filter out restricted fields (role, status, keys, createdBy)
  const updateData = {};
  Object.keys(payload).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = payload[key];
    }
  });

  // Check for email/mobile uniqueness if they're being updated
  if (updateData.email || updateData.mobile) {
    const existing = await Admin.findOne({
      _id: { $ne: adminId },
      $or: [
        ...(updateData.email ? [{ email: updateData.email }] : []),
        ...(updateData.mobile ? [{ mobile: updateData.mobile }] : [])
      ]
    });

    if (existing) {
      throw new Error("Email or mobile already exists");
    }
  }

  const admin = await Admin.findByIdAndUpdate(adminId, updateData, { new: true });
  if (!admin) throw new Error("Admin not found");
  return admin;
};

// TRANSFER ADMIN TO ANOTHER AGENT
exports.transferAdmin = async (adminId, newAgentId) => {
  // Check if admin exists
  const admin = await Admin.findById(adminId);
  if (!admin) throw new Error("Admin not found");

  // Check if new agent exists
  const Agent = require('../../agents/models/agent.model');
  const newAgent = await Agent.findById(newAgentId);
  if (!newAgent) throw new Error("Agent not found");

  // Update the admin with new agent info
  const updatedAdmin = await Admin.findByIdAndUpdate(
    adminId,
    {
      enrolledBy: newAgentId,
      enrolledAt: new Date()
    },
    { new: true }
  ).populate('enrolledBy', 'name email mobile')
   .populate('createdBy', 'name email mobile');

  return updatedAdmin;
};

// GET ADMIN DETAILED STATS
exports.getAdminDetailedStats = async (adminId) => {
  // Get admin basic info
  const admin = await Admin.findById(adminId)
    .populate('createdBy', 'name email mobile')
    .populate('enrolledBy', 'name email mobile')
    .select('-password')
    .lean();
  
  if (!admin) throw new Error("Admin not found");
  
  // Get package stats using payment transactions
  const packageStats = await PackagePaymentTransaction.aggregate([
    { $match: { admin: admin._id } },
    {
      $group: {
        _id: '$admin',
        totalPackages: { $sum: 1 },
        completedPackages: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingPackages: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        failedPackages: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              '$amount',
              0
            ]
          }
        }
      }
    }
  ]);
  
  // Get user counts
  const userCounts = await ClientUser.aggregate([
    { $match: { createdBy: admin._id } },
    {
      $group: {
        _id: '$createdBy',
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$status', 1] }, 1, 0] }
        },
        blockedUsers: {
          $sum: { $cond: [{ $eq: ['$status', 0] }, 1, 0] }
        }
      }
    }
  ]);
  
  // Get recent package transactions
  const recentTransactions = await PackagePaymentTransaction.find({ admin: admin._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email')
    .lean();
  
  // Format stats
  const packageData = packageStats[0] || {
    totalPackages: 0,
    completedPackages: 0,
    pendingPackages: 0,
    failedPackages: 0,
    totalRevenue: 0
  };
  
  const userData = userCounts[0] || {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0
  };
  
  return {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role,
      status: admin.status,
      createdAt: admin.createdAt,
      enrolledBy: admin.enrolledBy,
      createdBy: admin.createdBy
    },
    keyStats: {
      totalKeys: admin.totalKeys || 0,
      usedKeys: admin.usedKeys || 0,
      availableKeys: admin.availableKeys || 0
    },
    packages: {
      total: packageData.totalPackages,
      completed: packageData.completedPackages,
      pending: packageData.pendingPackages,
      failed: packageData.failedPackages,
      totalRevenue: packageData.totalRevenue
    },
    users: {
      total: userData.totalUsers,
      active: userData.activeUsers,
      blocked: userData.blockedUsers
    },
    recentTransactions: recentTransactions
  };
};