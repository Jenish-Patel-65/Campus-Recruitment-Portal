const db = require('../db');
const { 
  hashPassword, 
  comparePassword, 
  generateAuthToken, 
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken, 
  verifyResetToken 
} = require('../utils/auth.util');
const { sendPasswordResetEmail } = require('../utils/email.util');

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const token = generateAuthToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetToken = generateResetToken(user);
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(resetToken)}`;

      sendPasswordResetEmail(user.email, resetLink);
    }

    res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been generated.'
    });

  } catch (error) {
    next(error);
  }
};

// Reset Password
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid request' });
    }

    const user = result.rows[0];

    try {
      verifyResetToken(token, user.password_hash);
    } catch (err) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid or expired password reset token' 
      });
    }

    const hashed = await hashPassword(newPassword);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
      [hashed, user.id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Password has been successfully reset. You may now log in.'
    });

  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ status: 'error', message: 'Refresh token is required' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);

      const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(401).json({ status: 'error', message: 'User no longer exists' });
      }

      const user = result.rows[0];

      const token = generateAuthToken(user);
      
      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: { token }
      });
    } catch (err) {
      return res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
    }

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  logout,
  refresh,
};
