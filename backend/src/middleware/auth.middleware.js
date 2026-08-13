const { verifyAuthToken } = require('../utils/auth.util');

const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Forbidden: You do not have permission to access this resource.' 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
