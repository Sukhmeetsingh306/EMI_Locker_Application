const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const ApiError = require('../core/ApiError');
const logger = require('../config/logger');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = error.message || getReasonPhrase(statusCode);
    error = new ApiError(statusCode, message);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const { statusCode = StatusCodes.INTERNAL_SERVER_ERROR, message, details } = err;
  const response = {
    code: statusCode,
    message,
    ...(Object.keys(details || {}).length && { details }),
  };

  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error({ err }, 'Unhandled error');
  } else {
    logger.warn({ err }, 'Handled error');
  }

  res.status(statusCode).json(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};



