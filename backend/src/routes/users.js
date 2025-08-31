const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { logger } = require('../utils/logger');
const { UserService } = require('../services/user');

// Initialize services
const userService = new UserService();

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', async (req, res) => {
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
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const updates = req.body;

    const updatedUser = await userService.updateProfile(userId, updates);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified,
          updatedAt: updatedUser.updatedAt
        }
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      message: error.message
    });
  }
});

module.exports = router;
