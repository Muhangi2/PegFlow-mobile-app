const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { logger } = require('../utils/logger');
const { MobileMoneyService } = require('../services/mobileMoney');

// Initialize services
const mobileMoneyService = new MobileMoneyService();

/**
 * @route   GET /api/mobile-money/providers
 * @desc    Get supported mobile money providers
 * @access  Private
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = mobileMoneyService.getSupportedProviders();

    res.status(200).json({
      success: true,
      data: providers
    });

  } catch (error) {
    logger.error('Get providers error:', error);
    res.status(500).json({
      error: 'Failed to fetch mobile money providers',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/mobile-money/validate
 * @desc    Validate mobile money account number
 * @access  Private
 */
router.post('/validate', [
  body('provider').isIn(['mtn', 'airtel']).withMessage('Invalid provider'),
  body('accountNumber').notEmpty().withMessage('Account number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { provider, accountNumber } = req.body;

    // Validate phone number format
    const isValid = mobileMoneyService.validatePhoneNumber(accountNumber, provider);
    
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        message: `Please enter a valid ${provider.toUpperCase()} phone number`
      });
    }

    // Format phone number
    const formattedNumber = mobileMoneyService.formatPhoneNumber(accountNumber, provider);

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        provider,
        originalNumber: accountNumber,
        formattedNumber,
        message: 'Phone number format is valid'
      }
    });

  } catch (error) {
    logger.error('Validate account error:', error);
    res.status(500).json({
      error: 'Failed to validate account',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/mobile-money/limits/:provider
 * @desc    Get withdrawal limits for a specific provider
 * @access  Private
 */
router.get('/limits/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const providers = mobileMoneyService.getSupportedProviders();
    
    const providerInfo = providers.find(p => p.id === provider);
    
    if (!providerInfo) {
      return res.status(404).json({
        error: 'Provider not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        provider: providerInfo.id,
        name: providerInfo.name,
        minAmount: providerInfo.minAmount,
        maxAmount: providerInfo.maxAmount,
        fee: providerInfo.fee,
        feePercentage: `${(providerInfo.fee * 100)}%`
      }
    });

  } catch (error) {
    logger.error('Get limits error:', error);
    res.status(500).json({
      error: 'Failed to fetch provider limits',
      message: error.message
    });
  }
});

/**
 * @route   POST /api/mobile-money/check-status
 * @desc    Check transfer status
 * @access  Private
 */
router.post('/check-status', [
  body('provider').isIn(['mtn', 'airtel', 'flutterwave']).withMessage('Invalid provider'),
  body('reference').notEmpty().withMessage('Reference is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { provider, reference } = req.body;

    const status = await mobileMoneyService.checkTransferStatus(provider, reference);

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Check status error:', error);
    res.status(500).json({
      error: 'Failed to check transfer status',
      message: error.message
    });
  }
});

module.exports = router;
