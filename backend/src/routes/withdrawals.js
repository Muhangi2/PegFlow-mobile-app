const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { logger } = require('../utils/logger');
const { StellarService } = require('../services/stellar');
const { WithdrawalService } = require('../services/withdrawal');
const { MobileMoneyService } = require('../services/mobileMoney');

// Initialize services
const stellarService = new StellarService();
const withdrawalService = new WithdrawalService();
const mobileMoneyService = new MobileMoneyService();

/**
 * @route   POST /api/withdrawals/initiate
 * @desc    Initiate USDC withdrawal to local currency
 * @access  Private
 */
router.post('/initiate', [
  body('method').isIn(['mtn', 'airtel', 'bank']).withMessage('Invalid withdrawal method'),
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('usdcAmount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').isIn(['USDC']).withMessage('Only USDC is supported')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { method, accountNumber, usdcAmount, currency } = req.body;
    const userId = req.user.id;

    logger.info(`Withdrawal request: ${usdcAmount} ${currency} to ${method} - ${accountNumber}`);

    // Validate user has sufficient balance
    const userBalance = await stellarService.getUserBalance(userId);
    if (userBalance < usdcAmount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        currentBalance: userBalance,
        requiredAmount: usdcAmount
      });
    }

    // Get current exchange rate
    const exchangeRate = await withdrawalService.getExchangeRate();
    const ugxAmount = usdcAmount * exchangeRate;

    // Calculate fees
    const feePercentage = 0.005; // 0.5%
    const feeAmount = usdcAmount * feePercentage;
    const totalDeducted = usdcAmount + feeAmount;

    // Validate total amount including fees
    if (userBalance < totalDeducted) {
      return res.status(400).json({
        error: 'Insufficient balance including fees',
        currentBalance: userBalance,
        requiredAmount: totalDeducted,
        feeAmount
      });
    }

    // Process withdrawal
    const withdrawalResult = await withdrawalService.initiateWithdrawal({
      userId,
      method,
      accountNumber,
      usdcAmount,
      ugxAmount,
      feeAmount,
      exchangeRate
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      withdrawalId: withdrawalResult.withdrawalId,
      transactionHash: withdrawalResult.transactionHash,
      usdcAmount,
      ugxAmount: Math.floor(ugxAmount),
      feeAmount,
      exchangeRate,
      method,
      accountNumber,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Withdrawal error:', error);
    res.status(500).json({
      error: 'Failed to process withdrawal',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/withdrawals/history
 * @desc    Get user's withdrawal history
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const history = await withdrawalService.getWithdrawalHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: history.withdrawals,
      pagination: {
        currentPage: history.currentPage,
        totalPages: history.totalPages,
        totalItems: history.totalItems,
        hasNext: history.hasNext,
        hasPrev: history.hasPrev
      }
    });

  } catch (error) {
    logger.error('Get withdrawal history error:', error);
    res.status(500).json({
      error: 'Failed to fetch withdrawal history',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/withdrawals/:withdrawalId
 * @desc    Get specific withdrawal details
 * @access  Private
 */
router.get('/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const userId = req.user.id;

    const withdrawal = await withdrawalService.getWithdrawalDetails(withdrawalId, userId);

    if (!withdrawal) {
      return res.status(404).json({
        error: 'Withdrawal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: withdrawal
    });

  } catch (error) {
    logger.error('Get withdrawal details error:', error);
    res.status(500).json({
      error: 'Failed to fetch withdrawal details',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/withdrawals/rates
 * @desc    Get current exchange rates for withdrawals
 * @access  Private
 */
router.get('/rates', async (req, res) => {
  try {
    const rates = await withdrawalService.getExchangeRates();

    res.status(200).json({
      success: true,
      data: rates
    });

  } catch (error) {
    logger.error('Get rates error:', error);
    res.status(500).json({
      error: 'Failed to fetch exchange rates',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/withdrawals/methods
 * @desc    Get available withdrawal methods
 * @access  Private
 */
router.get('/methods', async (req, res) => {
  try {
    const methods = await withdrawalService.getAvailableMethods();

    res.status(200).json({
      success: true,
      data: methods
    });

  } catch (error) {
    logger.error('Get methods error:', error);
    res.status(500).json({
      error: 'Failed to fetch withdrawal methods',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/withdrawals/validate-account
 * @desc    Validate withdrawal account number
 * @access  Private
 */
router.post('/validate-account', [
  body('method').isIn(['mtn', 'airtel', 'bank']).withMessage('Invalid withdrawal method'),
  body('accountNumber').notEmpty().withMessage('Account number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { method, accountNumber } = req.body;

    const validation = await withdrawalService.validateAccount(method, accountNumber);

    res.status(200).json({
      success: true,
      data: validation
    });

  } catch (error) {
    logger.error('Account validation error:', error);
    res.status(500).json({
      error: 'Failed to validate account',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/withdrawals/cancel/:withdrawalId
 * @desc    Cancel a pending withdrawal
 * @access  Private
 */
router.post('/cancel/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const userId = req.user.id;

    const result = await withdrawalService.cancelWithdrawal(withdrawalId, userId);

    res.status(200).json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      data: result
    });

  } catch (error) {
    logger.error('Cancel withdrawal error:', error);
    res.status(500).json({
      error: 'Failed to cancel withdrawal',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/withdrawals/limits
 * @desc    Get withdrawal limits for different methods
 * @access  Private
 */
router.get('/limits', async (req, res) => {
  try {
    const limits = await withdrawalService.getWithdrawalLimits();

    res.status(200).json({
      success: true,
      data: limits
    });

  } catch (error) {
    logger.error('Get limits error:', error);
    res.status(500).json({
      error: 'Failed to fetch withdrawal limits',
      message: error.message
    });
  }
});

module.exports = router;
