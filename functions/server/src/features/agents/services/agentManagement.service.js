const Agent = require('../models/agent.model');
const Admin = require('../../admins/models/admin.model');
const { parsePagination, buildPaginationResponse, parseSort, buildSearchFilter } = require('../../../utils/pagination');

exports.createAgent = async (payload, superAdminId) => {
  const { name, email, mobile, password } = payload;

  // Check if agent with same email/mobile exists
  const existing = await Agent.findOne({
    $or: [
      ...(email ? [{ email }] : []),
      ...(mobile ? [{ mobile }] : [])
    ]
  });

  if (existing) {
    throw new Error("Agent with this email/mobile already exists");
  }

  // Create agent and link to superadmin
  const agent = await Agent.create({
    name,
    email,
    mobile,
    password,
    createdBy: superAdminId
  });

  return agent;
};

exports.getAgents = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  
  // Build filters
  const filters = {};
  
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
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Get total count
  const total = await Agent.countDocuments(filters);
  
  // Get paginated data
  const agents = await Agent.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name email')
    .select('-password')
    .lean();
  
  // Calculate totalEnrollments for each agent (count admins enrolled by this agent)
  const agentIds = agents.map(a => a._id);
  const enrollmentCounts = await Admin.aggregate([
    { 
      $match: { 
        enrolledBy: { $in: agentIds }
      } 
    },
    {
      $group: {
        _id: '$enrolledBy',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Create enrollment map
  const enrollmentMap = {};
  enrollmentCounts.forEach(stat => {
    enrollmentMap[stat._id.toString()] = stat.count;
  });
  
  // Attach enrollment counts to agents
  const agentsWithEnrollments = agents.map(agent => ({
    ...agent,
    totalEnrollments: enrollmentMap[agent._id.toString()] || 0
  }));
  
  return buildPaginationResponse(agentsWithEnrollments, total, page, limit);
};

exports.getAgentById = async (id) => {
  const agent = await Agent.findById(id)
    .populate('createdBy', 'name email')
    .select('-password')
    .lean();
  
  if (!agent) return null;
  
  // Calculate totalEnrollments
  const enrollmentCount = await Admin.countDocuments({ enrolledBy: id });
  agent.totalEnrollments = enrollmentCount;
  
  return agent;
};

exports.updateAgent = async (id, payload) => {
  // Check for email/mobile uniqueness if they're being updated
  if (payload.email || payload.mobile) {
    const existing = await Agent.findOne({
      _id: { $ne: id },
      $or: [
        ...(payload.email ? [{ email: payload.email }] : []),
        ...(payload.mobile ? [{ mobile: payload.mobile }] : [])
      ]
    });

    if (existing) {
      throw new Error("Email or mobile already exists");
    }
  }

  const agent = await Agent.findByIdAndUpdate(id, payload, { new: true }).select('-password');
  if (!agent) throw new Error("Agent not found");
  return agent;
};

exports.blockAgent = async (id) => {
  const agent = await Agent.findByIdAndUpdate(id, { status: 0 }, { new: true }).select('-password');
  if (!agent) throw new Error("Agent not found");
  return agent;
};

exports.unblockAgent = async (id) => {
  const agent = await Agent.findByIdAndUpdate(id, { status: 1 }, { new: true }).select('-password');
  if (!agent) throw new Error("Agent not found");
  return agent;
};

// Delete agent (blocks instead of deleting)
exports.deleteAgent = async (id) => {
  return exports.blockAgent(id);
};

