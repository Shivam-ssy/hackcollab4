const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and attach user to request
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from Bearer token string
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Use JWT payload directly instead of querying DB on every request
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
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access based on user role
 * @param {...String} roles - Roles that are allowed to access the route
 */
exports.authorize = (...rolesOrPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Check if user has the specific role
    if (req.user.role && rolesOrPermissions.includes(req.user.role)) {
      return next();
    }

    // Check if user has the specific permission
    if (req.user.permissions && req.user.permissions.some(p => rolesOrPermissions.includes(p))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role ${req.user.role} is not authorized to access this route`
    });
  };
};
