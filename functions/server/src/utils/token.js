const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (userId, expiresIn = env.jwtExpiresIn) => {
  return jwt.sign(
    {
      sub: userId,
    },
    env.jwtSecret,
    { expiresIn }
  );
};

module.exports = {
  generateToken,
};



