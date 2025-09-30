const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

class UserService {
  constructor() {
    const { database } = require('../config/database');
    this.db = database;
    
    // Fallback to in-memory storage for development
    this.users = new Map();
    this.blacklistedTokens = new Set();
    this.passwordResetTokens = new Map();
    
    logger.warn('UserService: Using in-memory storage. Configure DATABASE_URL for production.');
  }

  /**
   * Create a new user
   */
  async createUser({ phone, password, name, email }) {
    try {
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = {
        id: uuidv4(),
        phone,
        password: hashedPassword,
        name,
        email,
        isVerified: false,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        lastLogout: null
      };

      // Store user (in real app, this would be database)
      this.users.set(user.id, user);
      this.users.set(phone, user); // Index by phone

      logger.info(`User created: ${phone}`);
      return user;

    } catch (error) {
      logger.error('Create user error:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      return this.users.get(id) || null;
    } catch (error) {
      logger.error('Find user by ID error:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone) {
    try {
      return this.users.get(phone) || null;
    } catch (error) {
      logger.error('Find user by phone error:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(userId) {
    try {
      const user = this.users.get(userId);
      if (user) {
        user.lastLogin = new Date();
        user.updatedAt = new Date();
        this.users.set(userId, user);
        this.users.set(user.phone, user);
      }
    } catch (error) {
      logger.error('Update last login error:', error);
      throw new Error('Failed to update last login');
    }
  }

  /**
   * Update user's last logout time
   */
  async updateLastLogout(userId) {
    try {
      const user = this.users.get(userId);
      if (user) {
        user.lastLogout = new Date();
        user.updatedAt = new Date();
        this.users.set(userId, user);
        this.users.set(user.phone, user);
      }
    } catch (error) {
      logger.error('Update last logout error:', error);
      throw new Error('Failed to update last logout');
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId, newPassword) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      user.password = hashedPassword;
      user.updatedAt = new Date();

      this.users.set(userId, user);
      this.users.set(user.phone, user);

      logger.info(`Password updated for user: ${user.phone}`);
    } catch (error) {
      logger.error('Update password error:', error);
      throw new Error('Failed to update password');
    }
  }

  /**
   * Blacklist a token (for logout)
   */
  async blacklistToken(token) {
    try {
      this.blacklistedTokens.add(token);
      
      // Set expiration for blacklisted token (24 hours)
      setTimeout(() => {
        this.blacklistedTokens.delete(token);
      }, 24 * 60 * 60 * 1000);

      logger.info('Token blacklisted');
    } catch (error) {
      logger.error('Blacklist token error:', error);
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      return this.blacklistedTokens.has(token);
    } catch (error) {
      logger.error('Check token blacklist error:', error);
      throw new Error('Failed to check token blacklist');
    }
  }

  /**
   * Invalidate all tokens for a user (logout from all devices)
   */
  async invalidateAllTokens(userId) {
    try {
      // In a real implementation, you would store user tokens in database
      // and invalidate them. For now, we'll just log the action.
      logger.info(`All tokens invalidated for user: ${userId}`);
    } catch (error) {
      logger.error('Invalidate all tokens error:', error);
      throw new Error('Failed to invalidate tokens');
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(userId) {
    try {
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      this.passwordResetTokens.set(resetToken, {
        userId,
        expiresAt
      });

      // Clean up expired tokens
      setTimeout(() => {
        this.passwordResetTokens.delete(resetToken);
      }, 60 * 60 * 1000);

      logger.info(`Password reset token generated for user: ${userId}`);
      return resetToken;
    } catch (error) {
      logger.error('Generate password reset token error:', error);
      throw new Error('Failed to generate password reset token');
    }
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token) {
    try {
      const resetData = this.passwordResetTokens.get(token);
      
      if (!resetData) {
        return null;
      }

      if (new Date() > resetData.expiresAt) {
        this.passwordResetTokens.delete(token);
        return null;
      }

      // Remove token after verification
      this.passwordResetTokens.delete(token);
      
      return resetData.userId;
    } catch (error) {
      logger.error('Verify password reset token error:', error);
      throw new Error('Failed to verify password reset token');
    }
  }

  /**
   * Verify user account
   */
  async verifyUser(userId) {
    try {
      const user = this.users.get(userId);
      if (user) {
        user.isVerified = true;
        user.updatedAt = new Date();
        this.users.set(userId, user);
        this.users.set(user.phone, user);
        
        logger.info(`User verified: ${user.phone}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Verify user error:', error);
      throw new Error('Failed to verify user');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const user = this.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Only allow certain fields to be updated
      const allowedUpdates = ['name', 'email'];
      for (const [key, value] of Object.entries(updates)) {
        if (allowedUpdates.includes(key)) {
          user[key] = value;
        }
      }

      user.updatedAt = new Date();
      this.users.set(userId, user);
      this.users.set(user.phone, user);

      logger.info(`Profile updated for user: ${user.phone}`);
      return user;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(userId) {
    try {
      const user = this.users.get(userId);
      if (user) {
        this.users.delete(userId);
        this.users.delete(user.phone);
        
        logger.info(`User deleted: ${user.phone}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Delete user error:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const users = Array.from(this.users.values()).filter(user => user.id);
      
      return {
        total: users.length,
        verified: users.filter(u => u.isVerified).length,
        unverified: users.filter(u => !u.isVerified).length,
        activeToday: users.filter(u => {
          const today = new Date().toDateString();
          return u.lastLogin && u.lastLogin.toDateString() === today;
        }).length
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  /**
   * Search users
   */
  async searchUsers(query, limit = 10) {
    try {
      const users = Array.from(this.users.values()).filter(user => user.id);
      
      return users
        .filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.phone.includes(query) ||
          (user.email && user.email.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, limit)
        .map(user => ({
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }));
    } catch (error) {
      logger.error('Search users error:', error);
      throw new Error('Failed to search users');
    }
  }
}

module.exports = { UserService };
