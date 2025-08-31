const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { logger } = require('../utils/logger');
const { StellarService } = require('../services/stellar');
const { BillPaymentService } = require('../services/billPayment');
const { authMiddleware } = require('../middleware/auth');

// Initialize services
const stellarService = new StellarService();
const billPaymentService = new BillPaymentService();

/**
 * @route   POST /api/bills/pay
 * @desc    Pay a bill with USDC
 * @access  Private
 */
router.post('/pay', [
  body('billType').isIn(['electricity', 'internet', 'airtime', 'water', 'tv', 'other']).withMessage('Invalid bill type'),
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').isIn(['USDC']).withMessage('Only USDC is supported')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { billType, accountNumber, amount, currency } = req.body;
    const userId = req.user.id;

    logger.info(`Bill payment request: ${billType} - ${amount} ${currency} for account ${accountNumber}`);

    // Validate user has sufficient balance
    const userBalance = await stellarService.getUserBalance(userId);
    if (userBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        currentBalance: userBalance,
        requiredAmount: amount
      });
    }

    // Process bill payment
    const paymentResult = await billPaymentService.processBillPayment({
      userId,
      billType,
      accountNumber,
      amount,
      currency
    });

    res.status(200).json({
      success: true,
      message: 'Bill payment processed successfully',
      paymentId: paymentResult.paymentId,
      transactionHash: paymentResult.transactionHash,
      amount,
      currency,
      billType,
      accountNumber,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Bill payment error:', error);
    res.status(500).json({
      error: 'Failed to process bill payment',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/bills/history
 * @desc    Get user's bill payment history
 * @access  Private
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const history = await billPaymentService.getPaymentHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: history.payments,
      pagination: {
        currentPage: history.currentPage,
        totalPages: history.totalPages,
        totalItems: history.totalItems,
        hasNext: history.hasNext,
        hasPrev: history.hasPrev
      }
    });

  } catch (error) {
    logger.error('Get bill history error:', error);
    res.status(500).json({
      error: 'Failed to fetch bill payment history',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/bills/payment/:paymentId
 * @desc    Get specific bill payment details
 * @access  Private
 */
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await billPaymentService.getPaymentDetails(paymentId, userId);

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    logger.error('Get payment details error:', error);
    res.status(500).json({
      error: 'Failed to fetch payment details',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/bills/providers
 * @desc    Get available bill payment providers
 * @access  Private
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await billPaymentService.getAvailableProviders();

    res.status(200).json({
      success: true,
      data: providers
    });

  } catch (error) {
    logger.error('Get providers error:', error);
    res.status(500).json({
      error: 'Failed to fetch bill payment providers',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/bills/validate-account
 * @desc    Validate bill account number
 * @access  Private
 */
router.post('/validate-account', [
  body('billType').isIn(['electricity', 'internet', 'airtime', 'water', 'tv', 'other']).withMessage('Invalid bill type'),
  body('accountNumber').notEmpty().withMessage('Account number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { billType, accountNumber } = req.body;

    const validation = await billPaymentService.validateAccount(billType, accountNumber);

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
 * @route   GET /api/bills/rates
 * @desc    Get current exchange rates for bill payments
 * @access  Private
 */
router.get('/rates', async (req, res) => {
  try {
    const rates = await billPaymentService.getExchangeRates();

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

module.exports = router;
