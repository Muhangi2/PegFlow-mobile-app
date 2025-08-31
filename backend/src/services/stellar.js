const { StellarSdk } = require('stellar-sdk');
const { logger } = require('../utils/logger');

class StellarService {
  constructor() {
    this.network = process.env.STELLAR_NETWORK || 'testnet';
    this.horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.sorobanRpcUrl = process.env.STELLAR_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.contractId = process.env.STELLAR_CONTRACT_ID;
    this.usdcIssuer = process.env.USDC_ASSET_ISSUER;
    this.usdcCode = process.env.USDC_ASSET_CODE || 'USDC';
    
    // Initialize Stellar SDK
    this.server = new StellarSdk.Server(this.horizonUrl);
    
    // Mock data for development (replace with actual database)
    this.userBalances = new Map();
    this.transactions = new Map();
  }

  /**
   * Get user's USDC balance
   */
  async getUserBalance(userId) {
    try {
      // In a real implementation, this would query the smart contract
      // For now, return mock data
      const balance = this.userBalances.get(userId) || 0;
      
      logger.info(`Balance retrieved for user ${userId}: ${balance} USDC`);
      return balance;
    } catch (error) {
      logger.error('Get user balance error:', error);
      throw new Error('Failed to get user balance');
    }
  }

  /**
   * Send USDC to another user
   */
  async sendUSDC(fromUserId, toUserId, amount) {
    try {
      // Validate sender has sufficient balance
      const senderBalance = this.userBalances.get(fromUserId) || 0;
      if (senderBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Update balances
      this.userBalances.set(fromUserId, senderBalance - amount);
      const recipientBalance = this.userBalances.get(toUserId) || 0;
      this.userBalances.set(toUserId, recipientBalance + amount);

      // Record transaction
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transaction = {
        id: transactionId,
        fromUserId,
        toUserId,
        amount,
        currency: 'USDC',
        type: 'transfer',
        status: 'completed',
        timestamp: new Date(),
        hash: `stellar_hash_${transactionId}`
      };

      this.transactions.set(transactionId, transaction);

      logger.info(`USDC transfer: ${amount} from ${fromUserId} to ${toUserId}`);
      
      return {
        transactionHash: transaction.hash,
        transactionId,
        amount,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Send USDC error:', error);
      throw new Error('Failed to send USDC');
    }
  }

  /**
   * Deposit USDC to user wallet
   */
  async depositUSDC(userId, amount) {
    try {
      const currentBalance = this.userBalances.get(userId) || 0;
      this.userBalances.set(userId, currentBalance + amount);

      // Record transaction
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transaction = {
        id: transactionId,
        userId,
        amount,
        currency: 'USDC',
        type: 'deposit',
        status: 'completed',
        timestamp: new Date(),
        hash: `stellar_hash_${transactionId}`
      };

      this.transactions.set(transactionId, transaction);

      logger.info(`USDC deposit: ${amount} for user ${userId}`);
      
      return {
        transactionHash: transaction.hash,
        transactionId,
        amount,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Deposit USDC error:', error);
      throw new Error('Failed to deposit USDC');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const allTransactions = Array.from(this.transactions.values());
      
      // Filter transactions for this user
      const userTransactions = allTransactions.filter(tx => 
        tx.userId === userId || tx.fromUserId === userId || tx.toUserId === userId
      );

      // Sort by timestamp (newest first)
      userTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = userTransactions.slice(startIndex, endIndex);

      return {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(userTransactions.length / limit),
          totalItems: userTransactions.length,
          hasNext: endIndex < userTransactions.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  /**
   * Call smart contract function
   */
  async callContractFunction(functionName, args = []) {
    try {
      if (!this.contractId) {
        throw new Error('Contract ID not configured');
      }

      // In a real implementation, this would call the Soroban contract
      logger.info(`Contract function called: ${functionName} with args:`, args);
      
      return {
        success: true,
        result: 'mock_result'
      };
    } catch (error) {
      logger.error('Contract function call error:', error);
      throw new Error('Failed to call contract function');
    }
  }

  /**
   * Get USDC asset information
   */
  async getUSDCInfo() {
    try {
      return {
        code: this.usdcCode,
        issuer: this.usdcIssuer,
        network: this.network,
        decimals: 7
      };
    } catch (error) {
      logger.error('Get USDC info error:', error);
      throw new Error('Failed to get USDC information');
    }
  }

  /**
   * Get current exchange rate (USDC to UGX)
   */
  async getExchangeRate() {
    try {
      // In a real implementation, this would fetch from an exchange rate API
      // For now, return a fixed rate
      return 3800; // 1 USDC = 3800 UGX
    } catch (error) {
      logger.error('Get exchange rate error:', error);
      throw new Error('Failed to get exchange rate');
    }
  }

  /**
   * Create Stellar account
   */
  async createAccount(userId) {
    try {
      // In a real implementation, this would create a Stellar account
      logger.info(`Creating Stellar account for user: ${userId}`);
      
      return {
        accountId: `stellar_account_${userId}`,
        publicKey: `public_key_${userId}`,
        secretKey: `secret_key_${userId}` // In real app, this would be securely stored
      };
    } catch (error) {
      logger.error('Create account error:', error);
      throw new Error('Failed to create Stellar account');
    }
  }

  /**
   * Get account details
   */
  async getAccountDetails(accountId) {
    try {
      // In a real implementation, this would query the Stellar network
      return {
        accountId,
        balances: [
          {
            asset: 'native',
            balance: '100.0000000'
          },
          {
            asset: `${this.usdcCode}:${this.usdcIssuer}`,
            balance: '50.0000000'
          }
        ],
        sequence: '123456789'
      };
    } catch (error) {
      logger.error('Get account details error:', error);
      throw new Error('Failed to get account details');
    }
  }
}

module.exports = { StellarService };
