const db = require('../db');
const { 
  hashPassword, 
  comparePassword, 
  generateAuthToken, 
  generateRefreshToken,
  hashToken,
  generateResetToken, 
  verifyResetToken 
} = require('../utils/auth.util');
const { sendPasswordResetEmail } = require('../utils/email.util');

// Login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Background cleanup of expired tokens to prevent database bloat
    db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()').catch(err => 
      console.error('Failed to cleanup expired tokens:', err)
    );

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
    const refreshToken = generateRefreshToken();

    // Store hashed refresh token in DB
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, hashToken(refreshToken)]
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict'
    };

    res.cookie('token', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
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

    // Revoke all active sessions
    await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [user.id]);

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
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE token = $1', [hashToken(refreshToken)]);
    }

    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ status: 'error', message: 'Refresh token is required' });
    }

    try {
      const hashedToken = hashToken(refreshToken);
      const tokenResult = await db.query('SELECT * FROM refresh_tokens WHERE token = $1', [hashedToken]);
      
      if (tokenResult.rows.length === 0) {
        return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
      }

      const tokenData = tokenResult.rows[0];

      // Replay attack detection
      if (tokenData.is_revoked) {
        await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [tokenData.user_id]);
        return res.status(401).json({ status: 'error', message: 'Security alert: Token reuse detected. All sessions revoked.' });
      }

      // Check expiration
      if (new Date(tokenData.expires_at) < new Date()) {
        return res.status(401).json({ status: 'error', message: 'Refresh token expired' });
      }

      const result = await db.query('SELECT * FROM users WHERE id = $1', [tokenData.user_id]);
      if (result.rows.length === 0) {
        return res.status(401).json({ status: 'error', message: 'User no longer exists' });
      }

      const user = result.rows[0];

      // Mark old token as revoked (Rotation)
      await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE token = $1', [hashedToken]);

      // Generate new tokens
      const newToken = generateAuthToken(user);
      const newRefreshToken = generateRefreshToken();

      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) 
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, hashToken(newRefreshToken)]
      );
      
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict'
      };

      res.cookie('token', newToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully'
      });
    } catch (err) {
      return res.status(401).json({ status: 'error', message: 'Failed to refresh token' });
    }

  } catch (error) {
    next(error);
  }
};

// Get Me
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    
    const result = await db.query('SELECT id, email, role FROM users WHERE id = $1', [user.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { user: result.rows[0] }
    });
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
  getMe,
};
