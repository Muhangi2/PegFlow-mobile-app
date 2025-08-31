const axios = require('axios');
const { logger } = require('../utils/logger');

class MobileMoneyService {
  constructor() {
    this.mtnConfig = {
      apiUrl: process.env.MTN_API_URL || 'https://sandbox.momodeveloper.mtn.com',
      apiKey: process.env.MTN_API_KEY,
      subscriptionKey: process.env.MTN_SUBSCRIPTION_KEY,
      targetEnvironment: process.env.MTN_TARGET_ENVIRONMENT || 'sandbox'
    };

    this.airtelConfig = {
      apiUrl: process.env.AIRTEL_API_URL || 'https://openapiuat.airtel.africa',
      clientId: process.env.AIRTEL_CLIENT_ID,
      clientSecret: process.env.AIRTEL_CLIENT_SECRET,
      country: process.env.AIRTEL_COUNTRY || 'UG'
    };

    this.flutterwaveConfig = {
      apiUrl: process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY
    };
  }

  /**
   * Send money via MTN Mobile Money
   */
  async sendViaMTN(phoneNumber, amount, reference, description = 'USDC Withdrawal') {
    try {
      logger.info(`MTN Mobile Money transfer: ${amount} UGX to ${phoneNumber}`);

      // Get access token
      const accessToken = await this.getMTNAccessToken();

      // Initiate transfer
      const transferData = {
        amount: amount.toString(),
        currency: 'UGX',
        externalId: reference,
        payee: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: description,
        payeeNote: description
      };

      const response = await axios.post(
        `${this.mtnConfig.apiUrl}/collection/v1_0/requesttopay`,
        transferData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': reference,
            'X-Target-Environment': this.mtnConfig.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.mtnConfig.subscriptionKey,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`MTN transfer initiated: ${reference}`);
      return {
        success: true,
        reference,
        status: 'pending',
        provider: 'mtn',
        amount,
        phoneNumber
      };

    } catch (error) {
      logger.error('MTN Mobile Money error:', error.response?.data || error.message);
      throw new Error(`MTN transfer failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send money via Airtel Money
   */
  async sendViaAirtel(phoneNumber, amount, reference, description = 'USDC Withdrawal') {
    try {
      logger.info(`Airtel Money transfer: ${amount} UGX to ${phoneNumber}`);

      // Get access token
      const accessToken = await this.getAirtelAccessToken();

      // Initiate transfer
      const transferData = {
        reference: reference,
        subscriber: {
          country: this.airtelConfig.country,
          currency: 'UGX',
          msisdn: phoneNumber
        },
        transaction: {
          amount: amount.toString(),
          country: this.airtelConfig.country,
          currency: 'UGX',
          id: reference
        }
      };

      const response = await axios.post(
        `${this.airtelConfig.apiUrl}/merchant/v1/payments/`,
        transferData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Country': this.airtelConfig.country,
            'X-Currency': 'UGX'
          }
        }
      );

      logger.info(`Airtel transfer initiated: ${reference}`);
      return {
        success: true,
        reference,
        status: 'pending',
        provider: 'airtel',
        amount,
        phoneNumber
      };

    } catch (error) {
      logger.error('Airtel Money error:', error.response?.data || error.message);
      throw new Error(`Airtel transfer failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send money via Flutterwave (bank transfers)
   */
  async sendViaBank(accountNumber, amount, reference, bankCode, accountName) {
    try {
      logger.info(`Bank transfer: ${amount} UGX to ${accountNumber}`);

      const transferData = {
        tx_ref: reference,
        amount: amount.toString(),
        currency: 'UGX',
        recipient: accountNumber,
        meta: {
          reason: 'USDC Withdrawal',
          beneficiary_name: accountName
        },
        narration: 'USDC to UGX Withdrawal',
        callback_url: `${process.env.BACKEND_URL}/api/webhooks/flutterwave`,
        return_url: `${process.env.FRONTEND_URL}/withdrawal/success`
      };

      const response = await axios.post(
        `${this.flutterwaveConfig.apiUrl}/transfers`,
        transferData,
        {
          headers: {
            'Authorization': `Bearer ${this.flutterwaveConfig.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Bank transfer initiated: ${reference}`);
      return {
        success: true,
        reference,
        status: 'pending',
        provider: 'flutterwave',
        amount,
        accountNumber,
        bankCode
      };

    } catch (error) {
      logger.error('Bank transfer error:', error.response?.data || error.message);
      throw new Error(`Bank transfer failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get MTN Mobile Money access token
   */
  async getMTNAccessToken() {
    try {
      const response = await axios.post(
        `${this.mtnConfig.apiUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${this.mtnConfig.apiKey}`,
            'X-Reference-Id': this.generateReference(),
            'X-Target-Environment': this.mtnConfig.targetEnvironment,
            'Ocp-Apim-Subscription-Key': this.mtnConfig.subscriptionKey
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('MTN access token error:', error.response?.data || error.message);
      throw new Error('Failed to get MTN access token');
    }
  }

  /**
   * Get Airtel Money access token
   */
  async getAirtelAccessToken() {
    try {
      const response = await axios.post(
        `${this.airtelConfig.apiUrl}/auth/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.airtelConfig.clientId}:${this.airtelConfig.clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      logger.error('Airtel access token error:', error.response?.data || error.message);
      throw new Error('Failed to get Airtel access token');
    }
  }

  /**
   * Check transfer status
   */
  async checkTransferStatus(provider, reference) {
    try {
      switch (provider) {
        case 'mtn':
          return await this.checkMTNStatus(reference);
        case 'airtel':
          return await this.checkAirtelStatus(reference);
        case 'flutterwave':
          return await this.checkFlutterwaveStatus(reference);
        default:
          throw new Error('Invalid provider');
      }
    } catch (error) {
      logger.error(`Check ${provider} status error:`, error);
      throw error;
    }
  }

  /**
   * Check MTN transfer status
   */
  async checkMTNStatus(reference) {
    const accessToken = await this.getMTNAccessToken();
    
    const response = await axios.get(
      `${this.mtnConfig.apiUrl}/collection/v1_0/requesttopay/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': this.mtnConfig.targetEnvironment,
          'Ocp-Apim-Subscription-Key': this.mtnConfig.subscriptionKey
        }
      }
    );

    return {
      status: response.data.status,
      reference,
      provider: 'mtn'
    };
  }

  /**
   * Check Airtel transfer status
   */
  async checkAirtelStatus(reference) {
    const accessToken = await this.getAirtelAccessToken();
    
    const response = await axios.get(
      `${this.airtelConfig.apiUrl}/standard/v1/payments/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Country': this.airtelConfig.country,
          'X-Currency': 'UGX'
        }
      }
    );

    return {
      status: response.data.data.status,
      reference,
      provider: 'airtel'
    };
  }

  /**
   * Check Flutterwave transfer status
   */
  async checkFlutterwaveStatus(reference) {
    const response = await axios.get(
      `${this.flutterwaveConfig.apiUrl}/transfers/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${this.flutterwaveConfig.secretKey}`
        }
      }
    );

    return {
      status: response.data.data.status,
      reference,
      provider: 'flutterwave'
    };
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber, provider) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    switch (provider) {
      case 'mtn':
        return /^2567[0-9]{8}$/.test(cleanNumber);
      case 'airtel':
        return /^2567[0-9]{8}$/.test(cleanNumber);
      default:
        return /^256[0-9]{9}$/.test(cleanNumber);
    }
  }

  /**
   * Format phone number for API calls
   */
  formatPhoneNumber(phoneNumber, provider) {
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Remove country code if present
    if (cleanNumber.startsWith('256')) {
      cleanNumber = cleanNumber.substring(3);
    }
    
    // Add country code
    return `256${cleanNumber}`;
  }

  /**
   * Generate unique reference
   */
  generateReference() {
    return `SP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get supported providers
   */
  getSupportedProviders() {
    return [
      {
        id: 'mtn',
        name: 'MTN Mobile Money',
        logo: 'mtn-logo.png',
        minAmount: 1000,
        maxAmount: 10000000,
        fee: 0.01 // 1%
      },
      {
        id: 'airtel',
        name: 'Airtel Money',
        logo: 'airtel-logo.png',
        minAmount: 1000,
        maxAmount: 10000000,
        fee: 0.01 // 1%
      },
      {
        id: 'bank',
        name: 'Bank Transfer',
        logo: 'bank-logo.png',
        minAmount: 5000,
        maxAmount: 50000000,
        fee: 0.005 // 0.5%
      }
    ];
  }
}

module.exports = { MobileMoneyService };
