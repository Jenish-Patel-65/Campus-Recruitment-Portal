const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m';


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
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
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
  hashToken,
  generateResetToken,
  verifyResetToken,
};
