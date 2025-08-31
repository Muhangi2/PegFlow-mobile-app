const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { logger } = require('../utils/logger');
const { StellarService } = require('../services/stellar');

// Initialize services
const stellarService = new StellarService();

/**
 * @route   GET /api/wallet/balance
 * @desc    Get user's USDC balance
 * @access  Private
 */
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await stellarService.getUserBalance(userId);

    res.status(200).json({
      success: true,
      data: {
        balance,
        currency: 'USDC',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({
      error: 'Failed to get balance',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/wallet/send
 * @desc    Send USDC to another user
 * @access  Private
 */
router.post('/send', [
  body('recipient').notEmpty().withMessage('Recipient is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').isIn(['USDC']).withMessage('Only USDC is supported')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, amount, currency } = req.body;
    const senderId = req.user.id;

    logger.info(`USDC transfer request: ${amount} ${currency} from ${senderId} to ${recipient}`);

    // Validate sender has sufficient balance
    const senderBalance = await stellarService.getUserBalance(senderId);
    if (senderBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        currentBalance: senderBalance,
        requiredAmount: amount
      });
    }

    // Process transfer
    const transferResult = await stellarService.sendUSDC(senderId, recipient, amount);

    res.status(200).json({
      success: true,
      message: 'USDC sent successfully',
      data: {
        transactionHash: transferResult.transactionHash,
        amount,
        currency,
        recipient,
        sender: senderId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Send USDC error:', error);
    res.status(500).json({
      error: 'Failed to send USDC',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const transactions = await stellarService.getTransactionHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: transactions
    });

  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to get transaction history',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/wallet/deposit
 * @desc    Deposit USDC to wallet
 * @access  Private
 */
router.post('/deposit', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').isIn(['USDC']).withMessage('Only USDC is supported')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, currency } = req.body;
    const userId = req.user.id;

    logger.info(`Deposit request: ${amount} ${currency} for user ${userId}`);

    // Process deposit
    const depositResult = await stellarService.depositUSDC(userId, amount);

    res.status(200).json({
      success: true,
      message: 'Deposit processed successfully',
      data: {
        transactionHash: depositResult.transactionHash,
        amount,
        currency,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Deposit error:', error);
    res.status(500).json({
      error: 'Failed to process deposit',
      message: error.message
    });
  }
});

module.exports = router;
