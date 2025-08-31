const axios = require('axios');
const { logger } = require('../utils/logger');

class BillPaymentService {
  constructor() {
    // Mock data for development (replace with actual database)
    this.billPayments = new Map();
    this.providers = [
      {
        id: 'electricity',
        name: 'UMEME',
        code: 'UMEME',
        apiKey: process.env.UMEME_API_KEY,
        minAmount: 1000,
        maxAmount: 1000000
      },
      {
        id: 'water',
        name: 'NWSC',
        code: 'NWSC',
        apiKey: process.env.NWSC_API_KEY,
        minAmount: 500,
        maxAmount: 500000
      },
      {
        id: 'internet',
        name: 'Internet Providers',
        code: 'INTERNET',
        minAmount: 1000,
        maxAmount: 100000
      },
      {
        id: 'airtime',
        name: 'Mobile Airtime',
        code: 'AIRTIME',
        minAmount: 100,
        maxAmount: 100000
      },
      {
        id: 'tv',
        name: 'TV Subscription',
        code: 'TV',
        minAmount: 1000,
        maxAmount: 100000
      }
    ];
  }

  /**
   * Process bill payment
   */
  async processBillPayment({ userId, billType, accountNumber, amount, currency }) {
    try {
      const paymentId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment record
      const payment = {
        id: paymentId,
        userId,
        billType,
        accountNumber,
        amount,
        currency,
        status: 'pending',
        timestamp: new Date(),
        transactionHash: `stellar_hash_${paymentId}`
      };

      this.billPayments.set(paymentId, payment);

      // Process payment with provider
      const provider = this.providers.find(p => p.id === billType);
      if (provider) {
        const result = await this.processWithProvider(provider, payment);
        payment.status = result.success ? 'completed' : 'failed';
        payment.providerResponse = result;
      }

      logger.info(`Bill payment processed: ${paymentId} - ${amount} ${currency} for ${billType}`);
      
      return {
        paymentId,
        transactionHash: payment.transactionHash,
        status: payment.status
      };
    } catch (error) {
      logger.error('Process bill payment error:', error);
      throw new Error('Failed to process bill payment');
    }
  }

  /**
   * Process payment with specific provider
   */
  async processWithProvider(provider, payment) {
    try {
      // In a real implementation, this would call the provider's API
      logger.info(`Processing payment with ${provider.name} for account ${payment.accountNumber}`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        providerReference: `ref_${Date.now()}`,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      logger.error(`Provider payment error (${provider.name}):`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const allPayments = Array.from(this.billPayments.values());
      
      // Filter payments for this user
      const userPayments = allPayments.filter(payment => payment.userId === userId);

      // Sort by timestamp (newest first)
      userPayments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPayments = userPayments.slice(startIndex, endIndex);

      return {
        payments: paginatedPayments,
        currentPage: page,
        totalPages: Math.ceil(userPayments.length / limit),
        totalItems: userPayments.length,
        hasNext: endIndex < userPayments.length,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('Get payment history error:', error);
      throw new Error('Failed to get payment history');
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId, userId) {
    try {
      const payment = this.billPayments.get(paymentId);
      
      if (!payment || payment.userId !== userId) {
        return null;
      }

      return payment;
    } catch (error) {
      logger.error('Get payment details error:', error);
      throw new Error('Failed to get payment details');
    }
  }

  /**
   * Get available providers
   */
  async getAvailableProviders() {
    try {
      return this.providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        code: provider.code,
        minAmount: provider.minAmount,
        maxAmount: provider.maxAmount
      }));
    } catch (error) {
      logger.error('Get providers error:', error);
      throw new Error('Failed to get available providers');
    }
  }

  /**
   * Validate account number
   */
  async validateAccount(billType, accountNumber) {
    try {
      const provider = this.providers.find(p => p.id === billType);
      if (!provider) {
        return {
          isValid: false,
          message: 'Invalid bill type'
        };
      }

      // In a real implementation, this would validate with the provider's API
      logger.info(`Validating account ${accountNumber} with ${provider.name}`);

      // Simulate validation
      const isValid = accountNumber.length >= 6;
      
      return {
        isValid,
        message: isValid ? 'Account number is valid' : 'Invalid account number format',
        provider: provider.name
      };
    } catch (error) {
      logger.error('Validate account error:', error);
      throw new Error('Failed to validate account');
    }
  }

  /**
   * Get exchange rates for bill payments
   */
  async getExchangeRates() {
    try {
      // In a real implementation, this would fetch from an exchange rate API
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
   * Get bill payment statistics
   */
  async getPaymentStats(userId) {
    try {
      const allPayments = Array.from(this.billPayments.values());
      const userPayments = allPayments.filter(payment => payment.userId === userId);

      const stats = {
        totalPayments: userPayments.length,
        totalAmount: userPayments.reduce((sum, payment) => sum + payment.amount, 0),
        completedPayments: userPayments.filter(p => p.status === 'completed').length,
        pendingPayments: userPayments.filter(p => p.status === 'pending').length,
        failedPayments: userPayments.filter(p => p.status === 'failed').length,
        byType: {}
      };

      // Group by bill type
      userPayments.forEach(payment => {
        if (!stats.byType[payment.billType]) {
          stats.byType[payment.billType] = {
            count: 0,
            totalAmount: 0
          };
        }
        stats.byType[payment.billType].count++;
        stats.byType[payment.billType].totalAmount += payment.amount;
      });

      return stats;
    } catch (error) {
      logger.error('Get payment stats error:', error);
      throw new Error('Failed to get payment statistics');
    }
  }
}

module.exports = { BillPaymentService };
