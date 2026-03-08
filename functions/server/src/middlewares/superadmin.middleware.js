const { failure } = require('../core/response');

const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return failure(res, 'Super Admin access required', 403);
  }
  next();
};

module.exports = superAdminOnly;
