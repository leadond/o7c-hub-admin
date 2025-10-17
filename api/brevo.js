// Vercel API function to proxy Brevo (Sendinblue) API calls
// Protects sensitive API keys from client-side exposure

export default async function handler(req, res) {
  // Only allow POST method for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { endpoint = '/v3/smtp/email', payload } = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Missing required parameter: payload' });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('[Brevo Proxy] API key not configured');
      return res.status(500).json({ error: 'Brevo API key not configured' });
    }

    const url = `https://api.brevo.com${endpoint}`;

    console.log(`[Brevo Proxy] POST ${url}`);

    // Make request to Brevo API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`[Brevo Proxy] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[Brevo Proxy] Error response:', errorData);
      return res.status(response.status).json({
        success: false,
        error: `Brevo API error: ${errorData.message || response.statusText}`,
        code: errorData.code,
        details: errorData
      });
    }

    const data = await response.json();
    console.log('[Brevo Proxy] Email sent successfully');

    // Return success response (matching client implementation format)
    return res.status(200).json({
      success: true,
      messageId: data.messageId || `brevo_${Date.now()}`,
      to: payload.to?.[0]?.email || 'unknown',
      subject: payload.subject || 'No subject',
      sentAt: new Date().toISOString(),
      status: 'sent'
    });

  } catch (error) {
    console.error('[Brevo Proxy] Request failed:', error);

    // Return error response (matching client implementation format)
    return res.status(500).json({
      success: false,
      error: error.message,
      to: req.body?.payload?.to?.[0]?.email || 'unknown',
      subject: req.body?.payload?.subject || 'No subject',
      sentAt: new Date().toISOString(),
      status: 'failed'
    });
  }
}