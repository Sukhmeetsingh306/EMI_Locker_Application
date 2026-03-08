const agentMiddleware = (req, res, next) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Agent role required.'
    });
  }
  next();
};

module.exports = agentMiddleware;
