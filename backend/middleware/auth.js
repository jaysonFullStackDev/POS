// middleware/auth.js
// JWT authentication + role-based authorization middleware

const jwt = require('jsonwebtoken');

/**
 * authenticate
 * Verifies JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * authorize(...roles)
 * Factory that returns middleware restricting access to specified roles.
 * Usage: router.get('/admin-only', authenticate, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role(s): ${roles.join(', ')}`
    });
  }
  next();
};

module.exports = { authenticate, authorize };
