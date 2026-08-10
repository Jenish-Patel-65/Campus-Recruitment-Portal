const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// Passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
};

// Main Authentication JWT
const generateAuthToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyAuthToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Refresh Token
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

// Stateless Password Reset Token
const generateResetToken = (user) => {
  const payload = {
    id: user.id,
    purpose: 'password_reset'
  };
  const secret = JWT_SECRET + (user.password_hash || 'null');
  return jwt.sign(payload, secret, { expiresIn: '15m' }); // 15 minutes expiry
};

const verifyResetToken = (token, userHash) => {
  const secret = JWT_SECRET + (userHash || 'null');
  return jwt.verify(token, secret);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAuthToken,
  verifyAuthToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
};
