const jwt = require('jsonwebtoken');
const Admin = require('../../admins/models/admin.model');
const Agent = require('../../agents/models/agent.model');
const ClientUser = require('../../users/models/user.model');
const UserDevice = require('../../users/models/userDevice.model');

const generateToken = (id, role, type) => {
  return jwt.sign({ id, role, type }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// SUPERADMIN registering ADMIN or SUPERADMIN
const registerAdmin = async ({ name, email, mobile, password, role = "admin" }) => {
  const existing = await Admin.findOne({
    $or: [{ email }, { mobile }]
  });

  if (existing) throw new Error("Admin with this email/mobile already exists");

  // Create admin with 5 free keys
  const admin = await Admin.create({
    name,
    email,
    mobile,
    password,
    role,
    totalKeys: 5,
    availableKeys: 5,
    usedKeys: 0
  });

  const token = generateToken(admin._id, admin.role, "admin");

  return { user: admin, token, role: admin.role, type: "admin" };
};


// CLIENT USER LOGIN
const loginUser = async ({ emailOrMobile, password }) => {
  if (!emailOrMobile || !password) {
    throw new Error("Email/Mobile and password required");
  }

  // Check CLIENT USER (email OR mobile)
  let client = await ClientUser.findOne({
    $or: [
      { email: emailOrMobile },
      { mobile: emailOrMobile }
    ]
  });

  if (!client) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const clientMatch = await client.isPasswordMatch(password);
  if (!clientMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(client._id, "client", "client");

  // Get device lock status
  const userDevice = await UserDevice.findOne({ userId: client._id });
  const lockStatus = userDevice ? userDevice.deviceLocked : false;

  return {
    user: client,
    token,
    role: "client",
    type: "client",
    lockStatus
  };
};

// ADMIN/SUPERADMIN LOGIN
const loginAdmin = async ({ emailOrMobile, password }) => {
  if (!emailOrMobile || !password) {
    throw new Error("Email/Mobile and password required");
  }

  // Check ADMIN/SUPERADMIN (email OR mobile)
  let admin = await Admin.findOne({
    $or: [
      { email: emailOrMobile },
      { mobile: emailOrMobile }
    ]
  });

  if (!admin) {
    const error = new Error("Admin not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if admin is blocked
  if (admin.status === 0) {
    throw new Error("Your account has been blocked. Please contact administrator.");
  }

  const match = await admin.isPasswordMatch(password);
  if (!match) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(admin._id, admin.role, "admin");

  return {
    user: admin,
    token,
    role: admin.role,
    type: "admin"
  };
};

// AGENT LOGIN
const loginAgent = async ({ emailOrMobile, password }) => {
  if (!emailOrMobile || !password) {
    throw new Error("Email/Mobile and password required");
  }

  const agent = await Agent.findOne({
    $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
  });

  if (!agent) {
    const error = new Error("Agent not found");
    error.statusCode = 404;
    throw error;
  }

  // Check if agent is blocked
  if (agent.status === 0) {
    throw new Error("Your account has been blocked. Please contact administrator.");
  }

  const match = await agent.isPasswordMatch(password);
  if (!match) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(agent._id, 'agent', "agent");

  return {
    user: agent,
    token,
    role: 'agent',
    type: "agent"
  };
};

module.exports = {
  registerAdmin,
  loginUser,
  loginAdmin,
  loginAgent,
};
