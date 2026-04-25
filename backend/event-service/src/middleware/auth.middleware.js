const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes that require authentication
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Set user in request object matching the auth-service format
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        role: decoded.role,
        collegeId: decoded.collegeId,
        permissions: decoded.permissions || []
      };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - Invalid token'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 */
exports.authorize = (...rolesOrPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - User not found in request'
      });
    }

    if (req.user.role && rolesOrPermissions.includes(req.user.role)) {
      return next();
    }

    if (req.user.permissions && req.user.permissions.some(p => rolesOrPermissions.includes(p))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role ${req.user.role} is not authorized to access this route.`
    });
  };
};