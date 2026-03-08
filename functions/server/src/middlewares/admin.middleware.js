const { failure } = require('../core/response');

const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return failure(res, 'Admin access required', 403);
  }
  next();
};

module.exports = adminOnly;
