// Vercel API function to proxy HuggingFace API calls
// Protects sensitive API tokens from client-side exposure
// Updated to use official @huggingface/inference library

import { InferenceClient } from '@huggingface/inference';

// Simple logger for serverless environment
const logger = {
  info: (msg, data) => console.log(`[HuggingFace] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[HuggingFace] ${msg}`, data || ''),
  debug: (msg, data) => console.log(`[HuggingFace DEBUG] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[HuggingFace] ${msg}`, data || ''),
  authEvent: (event, data) => console.log(`[HuggingFace AUTH] ${event}`, data || ''),
  performance: (msg, duration, data) => console.log(`[HuggingFace PERF] ${msg}: ${duration}ms`, data || '')
};

// Simple error message sanitizer
const sanitizeErrorMessage = (message) => {
  if (!message) return 'Unknown error';
  // Remove any potential token information
  return message.replace(/hf_[a-zA-Z0-9]{34}/g, '[TOKEN_REDACTED]');
};

// Simple token format validation
const validateTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  const tokenRegex = /^hf_[a-zA-Z0-9]{34}$/;
  return tokenRegex.test(token);
};

/**
 * Validates Hugging Face API token format (legacy function for backward compatibility)
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token format is valid
 * @deprecated Use preRequestTokenValidation from tokenValidation.js instead
 */
function validateTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Hugging Face tokens start with "hf_" followed by 34 alphanumeric characters
  const tokenRegex = /^hf_[a-zA-Z0-9]{34}$/;
  return tokenRegex.test(token);
}

/**
 * Gets Hugging Face API token from environment variables
 * Supports both old and new naming conventions for backward compatibility
 * @returns {string|null} - The API token or null if not found
 */
function getHuggingFaceToken() {
  // Try server-side variable first (preferred)
  let token = process.env.HUGGINGFACE_API_TOKEN;
  
  // Fall back to client-side variable for backward compatibility
  if (!token) {
    token = process.env.VITE_HUGGINGFACE_API_TOKEN;
  }
  
  return token || null;
}

export default async function handler(req, res) {
  // Only allow POST method for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { model = 'google/flan-t5-small', inputs, options = {} } = req.body;

    if (!inputs) {
      return res.status(400).json({ error: 'Missing required parameter: inputs' });
    }

    const apiToken = getHuggingFaceToken();
    if (!apiToken) {
      logger.error('API token not configured', {
        errorCode: 'MISSING_TOKEN',
        environment: process.env.NODE_ENV
      });
      return res.status(500).json({ 
        error: 'HuggingFace API token not configured',
        errorCode: 'MISSING_TOKEN',
        troubleshooting: {
          steps: [
            'Set HUGGINGFACE_API_TOKEN environment variable',
            'Obtain token from https://huggingface.co/settings/tokens',
            'Ensure token has proper permissions for inference API'
          ]
        }
      });
    }

    // Simple token validation
    if (!validateTokenFormat(apiToken)) {
      logger.error('Invalid token format', { tokenLength: apiToken?.length || 0 });
      return res.status(500).json({ 
        error: 'Invalid HuggingFace API token format',
        errorCode: 'INVALID_TOKEN_FORMAT',
        troubleshooting: {
          steps: [
            'Verify token format is correct (should start with hf_ and be 37 characters total)',
            'Generate a new token at https://huggingface.co/settings/tokens',
            'Ensure no extra spaces or characters in environment variable'
          ]
        }
      });
    }

    logger.info('Token validation passed');
    const validatedToken = apiToken;

    // Create HuggingFace client with validated token
    const client = new InferenceClient(validatedToken);

    logger.info('Making API request', {
      model: model,
      inputLength: inputs.length,
      options: options
    });

    // Make request using HuggingFace client
    const startTime = Date.now();
    try {
      const result = await client.textGeneration({
        model: model,
        inputs: inputs,
        parameters: {
          wait_for_model: true,
          ...options
        }
      });
      const duration = Date.now() - startTime;

      logger.info('Response data received successfully', {
        model: model,
        duration: duration
      });

      // Extract response content
      const responseContent = result.generated_text?.trim() || '';

      // Return in expected format
      return res.status(200).json({
        success: true,
        response: responseContent,
        model: model,
        tokens: {
          prompt: 0, // HF free API doesn't provide token counts
          completion: 0,
          total: 0,
        },
        generatedAt: new Date().toISOString(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('API request failed', {
        error: sanitizeErrorMessage(error.message),
        model: model,
        duration: duration
      });
      
      // Handle specific HuggingFace errors
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed with HuggingFace API',
          errorCode: 'UNAUTHORIZED',
          message: 'Your HuggingFace API token is invalid or has expired. Please check your configuration.',
          troubleshooting: {
            steps: [
              'Verify your HuggingFace API token is valid',
              'Check if token has expired or been revoked',
              'Ensure token has proper permissions for inference API',
              'Generate a new token at https://huggingface.co/settings/tokens'
            ],
            documentation: 'https://huggingface.co/docs/api-inference/quicktour'
          }
        });
      }
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded for HuggingFace API',
          errorCode: 'RATE_LIMITED',
          message: 'Too many requests to HuggingFace API. Please wait before trying again.',
          troubleshooting: {
            steps: [
              'Wait before making another request',
              'Consider upgrading to a paid HuggingFace plan',
              'Implement request throttling in your application'
            ],
            documentation: 'https://huggingface.co/docs/api-inference/rate-limits'
          }
        });
      }
      
      if (error.message?.includes('503') || error.message?.includes('loading')) {
        return res.status(503).json({
          success: false,
          error: 'Model is currently loading',
          errorCode: 'MODEL_LOADING',
          message: 'The AI model is currently loading. Please try again in a few moments.',
          troubleshooting: {
            steps: [
              'Wait 10-30 seconds and try again',
              'The model needs time to load on first use',
              'Consider using a different model if this persists'
            ]
          }
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        success: false,
        error: sanitizeErrorMessage(error.message),
        errorCode: 'API_ERROR',
        message: 'An unexpected error occurred with the AI service. Please try again later.',
        troubleshooting: {
          steps: [
            'Try again in a few moments',
            'Check if the HuggingFace service is operational',
            'Contact support if the issue persists'
          ]
        }
      });
    }

  } catch (error) {
    // Error sanitization and logging
    const sanitizedMessage = sanitizeErrorMessage(error.message || 'Unknown error');
    
    logger.error('Request failed with exception', {
      error: sanitizedMessage,
      errorCode: error.code,
      errorName: error.name,
      model: req.body?.model || 'google/flan-t5-large'
    });
    
    // Categorize different types of errors
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An internal server error occurred while processing your AI request.';
    let troubleshooting = {
      steps: [
        'Try again in a few moments',
        'Check your internet connection',
        'Contact support if the issue persists'
      ]
    };
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorCode = 'NETWORK_ERROR';
      message = 'Unable to connect to the AI service. Please check your internet connection.';
      troubleshooting = {
        steps: [
          'Check your internet connection',
          'Verify that HuggingFace services are operational',
          'Try again in a few moments'
        ]
      };
    } else if (error.code === 'ETIMEDOUT') {
      errorCode = 'TIMEOUT_ERROR';
      message = 'The AI service request timed out. Please try again.';
      troubleshooting = {
        steps: [
          'Try again with a shorter input',
          'Check your internet connection speed',
          'The service may be experiencing high load'
        ]
      };
    }
    
    return res.status(500).json({
      success: false,
      error: sanitizedMessage,
      errorCode,
      message,
      troubleshooting,
      response: null,
      model: req.body?.model || 'gpt2',
      tokens: { prompt: 0, completion: 0, total: 0 },
      generatedAt: new Date().toISOString(),
    });
  }
}