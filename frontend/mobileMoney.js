const axios = require('axios');
const Transaction = require('../backend/models/Transaction');

class MobileMoneyService {
  constructor(provider) {
    this.provider = provider;
    this.config = {
      airtel: {
        baseUrl: 'https://api.airtel.africa',
        auth: `Bearer ${process.env.AIRTEL_API_KEY}`
      },
      tnm: {
        baseUrl: 'https://api.tnm.co.mw',
        auth: `Bearer ${process.env.TNM_API_KEY}`
      }
    }[provider];
  }

  async initiatePayment(phone, amount, reference) {
    try {
      const response = await axios.post(`${this.config.baseUrl}/payments`, {
        subscriber: {
          msisdn: phone
        },
        transaction: {
          amount: amount,
          reference: reference,
          id: `txn_${Date.now()}`
        }
      }, {
        headers: {
          'Authorization': this.config.auth,
          'Content-Type': 'application/json'
        }
      });

      // Save transaction
      const txn = new Transaction({
        provider: this.provider,
        phone,
        amount,
        reference,
        status: 'initiated',
        providerReference: response.data.transactionId
      });
      await txn.save();

      return {
        success: true,
        transactionId: txn._id
      };
    } catch (error) {
      console.error(`${this.provider} payment error:`, error);
      
      // Save failed transaction for retry
      const txn = new Transaction({
        provider: this.provider,
        phone,
        amount,
        reference,
        status: 'failed',
        error: error.message
      });
      await txn.save();

      return {
        success: false,
        message: 'Payment initiation failed. Will retry later.'
      };
    }
  }
}

module.exports = MobileMoneyService;