// Vercel API function for Square payment processing
// Handles payment creation and processing securely

import { Client, Environment } from 'squareup';

// Initialize Square client
function getSquareClient() {
  const environment = process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox;
    
  return new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: environment,
  });
}

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Check environment variables
  if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_APPLICATION_ID || !process.env.SQUARE_LOCATION_ID) {
    console.error('Missing Square environment variables:', {
      hasAccessToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasApplicationId: !!process.env.SQUARE_APPLICATION_ID,
      hasLocationId: !!process.env.SQUARE_LOCATION_ID
    });
    return res.status(500).json({ 
      error: 'Square API not configured',
      message: 'Missing required environment variables (ACCESS_TOKEN, APPLICATION_ID, LOCATION_ID)' 
    });
  }

  try {
    const { action, ...data } = req.body;

    switch (action) {
      case 'createPayment':
        return await createPayment(req, res, data);
      case 'getPayment':
        return await getPayment(req, res, data);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Square API error:', error);
    return res.status(500).json({ 
      error: 'Payment processing error',
      message: error.message 
    });
  }
}

// Create a payment
async function createPayment(req, res, data) {
  const { sourceId, amountMoney, idempotencyKey, buyerEmailAddress, note } = data;

  if (!sourceId || !amountMoney || !idempotencyKey) {
    return res.status(400).json({ 
      error: 'Missing required fields: sourceId, amountMoney, idempotencyKey' 
    });
  }

  try {
    const client = getSquareClient();
    const { paymentsApi } = client;

    const requestBody = {
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: amountMoney.amount,
        currency: amountMoney.currency || 'USD'
      },
      locationId: process.env.SQUARE_LOCATION_ID
    };

    // Add optional fields
    if (buyerEmailAddress) {
      requestBody.buyerEmailAddress = buyerEmailAddress;
    }
    if (note) {
      requestBody.note = note;
    }

    const response = await paymentsApi.createPayment(requestBody);

    if (response.result) {
      return res.status(200).json({
        success: true,
        payment: response.result.payment
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment creation failed',
        errors: response.errors
      });
    }
  } catch (error) {
    console.error('Create payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Payment processing failed',
      message: error.message
    });
  }
}

// Get payment details
async function getPayment(req, res, data) {
  const { paymentId } = data;

  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    const client = getSquareClient();
    const { paymentsApi } = client;

    const response = await paymentsApi.getPayment(paymentId);

    if (response.result) {
      return res.status(200).json({
        success: true,
        payment: response.result.payment
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        errors: response.errors
      });
    }
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment',
      message: error.message
    });
  }
}