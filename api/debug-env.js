// Debug endpoint to check environment variables (remove in production)

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // Check environment variables (without exposing actual values)
    const envCheck = {
      BASE44_API_KEY: {
        exists: !!process.env.BASE44_API_KEY,
        length: process.env.BASE44_API_KEY ? process.env.BASE44_API_KEY.length : 0,
        preview: process.env.BASE44_API_KEY ? process.env.BASE44_API_KEY.substring(0, 8) + '...' : 'NOT_SET'
      },
      BASE44_APP_ID: {
        exists: !!process.env.BASE44_APP_ID,
        length: process.env.BASE44_APP_ID ? process.env.BASE44_APP_ID.length : 0,
        preview: process.env.BASE44_APP_ID ? process.env.BASE44_APP_ID.substring(0, 8) + '...' : 'NOT_SET'
      },
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    };

    console.log('[Debug] Environment variables check:', envCheck);

    return res.status(200).json({
      message: 'Environment variables check',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug] Error checking environment:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}