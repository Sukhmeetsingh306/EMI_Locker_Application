const { failure } = require('../core/response');

const clientOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'client') {
    return failure(res, 'Client access required', 403);
  }
  next();
};

module.exports = clientOnly;
