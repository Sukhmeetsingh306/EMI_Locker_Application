const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../../core/ApiError');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (payload = {}) => {
  const errors = {};
  if (!payload.name || !payload.name.trim()) {
    errors.name = 'Name is required';
  }
  if (!payload.email || !emailRegex.test(payload.email)) {
    errors.email = 'Valid email is required';
  }
  if (!payload.password || payload.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (Object.keys(errors).length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid registration data', errors);
  }

  return {
    name: payload.name.trim(),
    email: payload.email.toLowerCase(),
    password: payload.password,
  };
};

const validateLogin = (payload = {}) => {
  const errors = {};
  if (!payload.email || !emailRegex.test(payload.email)) {
    errors.email = 'Valid email is required';
  }
  if (!payload.password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid login data', errors);
  }

  return {
    email: payload.email.toLowerCase(),
    password: payload.password,
  };
};

module.exports = {
  validateRegister,
  validateLogin,
};



