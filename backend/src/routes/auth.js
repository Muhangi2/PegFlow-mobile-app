const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { logger } = require('../utils/logger');
const { UserService } = require('../services/user');
const { authMiddleware } = require('../middleware/auth');

// Initialize services
const userService = new UserService();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  body('phone').isMobilePhone('en-UG').withMessage('Valid Ugandan phone number required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number and one special character'),
  body('name').notEmpty().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password, name, email } = req.body;

    // Check if user already exists
    const existingUser = await userService.findByPhone(phone);
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this phone number already exists'
      });
    }

    // Create new user
    const user = await userService.createUser({
      phone,
      password,
      name,
      email
    });

    // Generate JWT token with additional security claims
    const token = jwt.sign(
      { 
        id: user.id, 
        phone: user.phone,
        iat: Math.floor(Date.now() / 1000),
        jti: require('crypto').randomBytes(16).toString('hex') // JWT ID for token blacklisting
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Reduced from 7d for security
        issuer: 'payvia-backend',
        audience: 'payvia-app'
      }
    );

    logger.info(`New user registered: ${phone}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        },
        token
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('phone').isMobilePhone('en-UG').withMessage('Valid Ugandan phone number required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    // Find user by phone
    const user = await userService.findByPhone(phone);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last login
    await userService.updateLastLogin(user.id);

    logger.info(`User logged in: ${phone}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        },
        token
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Add token to blacklist (if using Redis)
      await userService.blacklistToken(token);
    }

    // Update user's last logout
    await userService.updateLastLogout(userId);

    logger.info(`User logged out: ${req.user.phone}`);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Failed to logout',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Invalidate all tokens for this user
    await userService.invalidateAllTokens(userId);

    // Update user's last logout
    await userService.updateLastLogout(userId);

    logger.info(`User logged out from all devices: ${req.user.phone}`);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      error: 'Failed to logout from all devices',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Generate new JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', [
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Update password
    await userService.updatePassword(userId, newPassword);

    // Invalidate all tokens to force re-login
    await userService.invalidateAllTokens(userId);

    logger.info(`Password changed for user: ${user.phone}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link
 * @access  Public
 */
router.post('/forgot-password', [
  body('phone').isMobilePhone('en-UG').withMessage('Valid Ugandan phone number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    const user = await userService.findByPhone(phone);
    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: 'If a user with this phone number exists, a reset link will be sent.'
      });
    }

    // Generate reset token
    const resetToken = await userService.generatePasswordResetToken(user.id);

    // Send SMS with reset link (implement SMS service)
    // await smsService.sendPasswordReset(user.phone, resetToken);

    logger.info(`Password reset requested for: ${phone}`);

    res.status(200).json({
      success: true,
      message: 'If a user with this phone number exists, a reset link will be sent.'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Failed to process password reset request',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Verify and use reset token
    const userId = await userService.verifyPasswordResetToken(token);
    if (!userId) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    // Update password
    await userService.updatePassword(userId, newPassword);

    // Invalidate all tokens
    await userService.invalidateAllTokens(userId);

    logger.info(`Password reset completed for user ID: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Failed to reset password',
      message: error.message
    });
  }
});

module.exports = router;
