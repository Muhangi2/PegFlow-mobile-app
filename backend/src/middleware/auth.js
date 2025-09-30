const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const { UserService } = require('../services/user');

const userService = new UserService();

/**
 * Authentication middleware
 * Validates JWT token and adds user info to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      logger.error('JWT_SECRET is not properly configured or too short');
      return res.status(500).json({
        error: 'Authentication service configuration error'
      });
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate token format
    if (!token || token.split('.').length !== 3) {
      return res.status(401).json({
        error: 'Invalid token format'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await userService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token has been invalidated. Please login again.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await userService.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found. Please login again.'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified
    };

    next();

  } catch (error) {
    logger.error('Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token. Please login again.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired. Please login again.'
      });
    }

    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't require token
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const isBlacklisted = await userService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await userService.findById(decoded.id);
    if (!user) {
      req.user = null;
      return next();
    }

    // Add user info to request
    req.user = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified
    };

    next();

  } catch (error) {
    // If any error occurs, continue without authentication
    req.user = null;
    next();
  }
};

/**
 * Admin authentication middleware
 * Requires user to be verified and have admin role
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // First authenticate user
    await authMiddleware(req, res, async () => {
      // Check if user is verified
      if (!req.user.isVerified) {
        return res.status(403).json({
          error: 'Account not verified. Please verify your account first.'
        });
      }

      // Check if user has admin role (implement role system)
      const user = await userService.findById(req.user.id);
      if (!user.isAdmin) {
        return res.status(403).json({
          error: 'Access denied. Admin privileges required.'
        });
      }

      next();
    });

  } catch (error) {
    logger.error('Admin authentication error:', error);
    res.status(500).json({
      error: 'Admin authentication failed',
      message: error.message
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Password reset rate limiting
 */
const passwordResetRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminAuthMiddleware,
  authRateLimit,
  passwordResetRateLimit
};
