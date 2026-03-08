const { success, failure } = require('../../../core/response');
const authService = require('../services/auth.service');

// SUPERADMIN can register ADMIN or SUPERADMIN
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    const result = await authService.registerAdmin({
      name,
      email,
      mobile,
      password,
      role: role || "admin"
    });

    return success(res, { data: result }, 'Admin registered successfully', 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// CLIENT USER LOGIN
exports.login = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const result = await authService.loginUser({
      emailOrMobile,
      password
    });

    return success(res, { data: result }, 'Login successful', 200);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return failure(res, err.message, statusCode);
  }
};

// ADMIN/SUPERADMIN LOGIN
exports.adminLogin = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const result = await authService.loginAdmin({
      emailOrMobile,
      password
    });

    return success(res, { data: result }, 'Login successful', 200);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return failure(res, err.message, statusCode);
  }
};

// AGENT LOGIN
exports.agentLogin = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    const result = await authService.loginAgent({
      emailOrMobile,
      password
    });

    return success(res, { data: result }, 'Login successful', 200);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return failure(res, err.message, statusCode);
  }
};
