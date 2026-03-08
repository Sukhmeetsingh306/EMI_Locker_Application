const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = notFoundHandler;



