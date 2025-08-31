const { logger } = require('../utils/logger');
const { MobileMoneyService } = require('./mobileMoney');

class WithdrawalService {
  constructor() {
    // Mock data for development (replace with actual database)
    this.withdrawals = new Map();
    this.mobileMoneyService = new MobileMoneyService();
  }

  /**
   * Initiate withdrawal
   */
  async initiateWithdrawal({ userId, method, accountNumber, usdcAmount, ugxAmount, feeAmount, exchangeRate }) {
    try {
      const withdrawalId = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create withdrawal record
      const withdrawal = {
        id: withdrawalId,
        userId,
        method,
        accountNumber,
        usdcAmount,
        ugxAmount: Math.floor(ugxAmount),
        feeAmount,
        exchangeRate,
        status: 'pending',
        timestamp: new Date(),
        transactionHash: `stellar_hash_${withdrawalId}`
      };

      this.withdrawals.set(withdrawalId, withdrawal);

      // Process withdrawal based on method
      let result;
      switch (method) {
        case 'mtn':
        case 'airtel':
          result = await this.processMobileMoneyWithdrawal(withdrawal);
          break;
        case 'bank':
          result = await this.processBankWithdrawal(withdrawal);
          break;
        default:
          throw new Error('Invalid withdrawal method');
      }

      withdrawal.status = result.success ? 'processing' : 'failed';
      withdrawal.providerResponse = result;

      logger.info(`Withdrawal initiated: ${withdrawalId} - ${usdcAmount} USDC to ${method}`);
      
      return {
        withdrawalId,
        transactionHash: withdrawal.transactionHash,
        status: withdrawal.status
      };
    } catch (error) {
      logger.error('Initiate withdrawal error:', error);
      throw new Error('Failed to initiate withdrawal');
    }
  }

  /**
   * Process mobile money withdrawal
   */
  async processMobileMoneyWithdrawal(withdrawal) {
    try {
      const { method, accountNumber, ugxAmount } = withdrawal;
      
      if (method === 'mtn') {
        return await this.mobileMoneyService.sendViaMTN(
          accountNumber,
          ugxAmount,
          withdrawal.id,
          'USDC Withdrawal'
        );
      } else if (method === 'airtel') {
        return await this.mobileMoneyService.sendViaAirtel(
          accountNumber,
          ugxAmount,
          withdrawal.id,
          'USDC Withdrawal'
        );
      }
    } catch (error) {
      logger.error('Mobile money withdrawal error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process bank withdrawal
   */
  async processBankWithdrawal(withdrawal) {
    try {
      const { accountNumber, ugxAmount } = withdrawal;
      
      return await this.mobileMoneyService.sendViaBank(
        accountNumber,
        ugxAmount,
        withdrawal.id,
        'BANK_CODE', // In real app, this would be the actual bank code
        'Account Holder' // In real app, this would be the account holder name
      );
    } catch (error) {
      logger.error('Bank withdrawal error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const allWithdrawals = Array.from(this.withdrawals.values());
      
      // Filter withdrawals for this user
      const userWithdrawals = allWithdrawals.filter(withdrawal => withdrawal.userId === userId);

      // Sort by timestamp (newest first)
      userWithdrawals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedWithdrawals = userWithdrawals.slice(startIndex, endIndex);

      return {
        withdrawals: paginatedWithdrawals,
        currentPage: page,
        totalPages: Math.ceil(userWithdrawals.length / limit),
        totalItems: userWithdrawals.length,
        hasNext: endIndex < userWithdrawals.length,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('Get withdrawal history error:', error);
      throw new Error('Failed to get withdrawal history');
    }
  }

  /**
   * Get withdrawal details
   */
  async getWithdrawalDetails(withdrawalId, userId) {
    try {
      const withdrawal = this.withdrawals.get(withdrawalId);
      
      if (!withdrawal || withdrawal.userId !== userId) {
        return null;
      }

      return withdrawal;
    } catch (error) {
      logger.error('Get withdrawal details error:', error);
      throw new Error('Failed to get withdrawal details');
    }
  }

  /**
   * Get current exchange rate
   */
  async getExchangeRate() {
    try {
      // In a real implementation, this would fetch from an exchange rate API
      return 3800; // 1 USDC = 3800 UGX
    } catch (error) {
      logger.error('Get exchange rate error:', error);
      throw new Error('Failed to get exchange rate');
    }
  }

  /**
   * Get exchange rates for different currencies
   */
  async getExchangeRates() {
    try {
      return {
        USDC: {
          UGX: 3800,
          USD: 1.0
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Get exchange rates error:', error);
      throw new Error('Failed to get exchange rates');
    }
  }

  /**
   * Get available withdrawal methods
   */
  async getAvailableMethods() {
    try {
      return this.mobileMoneyService.getSupportedProviders();
    } catch (error) {
      logger.error('Get available methods error:', error);
      throw new Error('Failed to get available withdrawal methods');
    }
  }

  /**
   * Validate account number
   */
  async validateAccount(method, accountNumber) {
    try {
      if (method === 'mtn' || method === 'airtel') {
        return this.mobileMoneyService.validatePhoneNumber(accountNumber, method);
      } else if (method === 'bank') {
        // Bank account validation logic
        return accountNumber.length >= 8;
      }
      
      return false;
    } catch (error) {
      logger.error('Validate account error:', error);
      throw new Error('Failed to validate account');
    }
  }

  /**
   * Cancel withdrawal
   */
  async cancelWithdrawal(withdrawalId, userId) {
    try {
      const withdrawal = this.withdrawals.get(withdrawalId);
      
      if (!withdrawal || withdrawal.userId !== userId) {
        throw new Error('Withdrawal not found');
      }

      if (withdrawal.status !== 'pending') {
        throw new Error('Cannot cancel withdrawal that is not pending');
      }

      withdrawal.status = 'cancelled';
      withdrawal.cancelledAt = new Date();

      logger.info(`Withdrawal cancelled: ${withdrawalId}`);
      
      return withdrawal;
    } catch (error) {
      logger.error('Cancel withdrawal error:', error);
      throw new Error('Failed to cancel withdrawal');
    }
  }

  /**
   * Get withdrawal limits
   */
  async getWithdrawalLimits() {
    try {
      const methods = await this.getAvailableMethods();
      
      return methods.map(method => ({
        method: method.id,
        name: method.name,
        minAmount: method.minAmount,
        maxAmount: method.maxAmount,
        fee: method.fee,
        feePercentage: `${(method.fee * 100)}%`
      }));
    } catch (error) {
      logger.error('Get withdrawal limits error:', error);
      throw new Error('Failed to get withdrawal limits');
    }
  }

  /**
   * Get withdrawal statistics
   */
  async getWithdrawalStats(userId) {
    try {
      const allWithdrawals = Array.from(this.withdrawals.values());
      const userWithdrawals = allWithdrawals.filter(withdrawal => withdrawal.userId === userId);

      const stats = {
        totalWithdrawals: userWithdrawals.length,
        totalUSDCAmount: userWithdrawals.reduce((sum, w) => sum + w.usdcAmount, 0),
        totalUGXAmount: userWithdrawals.reduce((sum, w) => sum + w.ugxAmount, 0),
        totalFees: userWithdrawals.reduce((sum, w) => sum + w.feeAmount, 0),
        completedWithdrawals: userWithdrawals.filter(w => w.status === 'completed').length,
        pendingWithdrawals: userWithdrawals.filter(w => w.status === 'pending').length,
        processingWithdrawals: userWithdrawals.filter(w => w.status === 'processing').length,
        failedWithdrawals: userWithdrawals.filter(w => w.status === 'failed').length,
        byMethod: {}
      };

      // Group by method
      userWithdrawals.forEach(withdrawal => {
        if (!stats.byMethod[withdrawal.method]) {
          stats.byMethod[withdrawal.method] = {
            count: 0,
            totalUSDCAmount: 0,
            totalUGXAmount: 0
          };
        }
        stats.byMethod[withdrawal.method].count++;
        stats.byMethod[withdrawal.method].totalUSDCAmount += withdrawal.usdcAmount;
        stats.byMethod[withdrawal.method].totalUGXAmount += withdrawal.ugxAmount;
      });

      return stats;
    } catch (error) {
      logger.error('Get withdrawal stats error:', error);
      throw new Error('Failed to get withdrawal statistics');
    }
  }
}

module.exports = { WithdrawalService };
