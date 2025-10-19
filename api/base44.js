// Vercel API function to proxy Base44 API calls
// Protects sensitive API keys from client-side exposure

const BASE_URL = `https://app.base44.com/api/apps/${process.env.BASE44_APP_ID}/entities`;

export default async function handler(req, res) {
  // Only allow POST method for security (all operations tunneled through POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Debug environment variables
  console.log('[Base44 Proxy] Environment check:', {
    hasApiKey: !!process.env.BASE44_API_KEY,
    hasAppId: !!process.env.BASE44_APP_ID,
    apiKeyLength: process.env.BASE44_API_KEY ? process.env.BASE44_API_KEY.length : 0,
    appIdLength: process.env.BASE44_APP_ID ? process.env.BASE44_APP_ID.length : 0
  });

  // Check if environment variables are set
  if (!process.env.BASE44_API_KEY) {
    console.error('[Base44 Proxy] BASE44_API_KEY not set');
    return res.status(500).json({ 
      error: 'BASE44_API_KEY environment variable not configured',
      debug: 'Check Vercel environment variables'
    });
  }

  if (!process.env.BASE44_APP_ID) {
    console.error('[Base44 Proxy] BASE44_APP_ID not set');
    return res.status(500).json({ 
      error: 'BASE44_APP_ID environment variable not configured',
      debug: 'Check Vercel environment variables'
    });
  }

  try {
    const { method, path, body, query } = req.body;

    if (!method || !path) {
      return res.status(400).json({ error: 'Missing required parameters: method, path' });
    }

    // Validate allowed HTTP methods
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    if (!allowedMethods.includes(method.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid method. Allowed: GET, POST, PUT, DELETE' });
    }

    // Construct full URL
    let fullUrl = `${BASE_URL}${path}`;

    // Add query parameters if provided
    if (query && typeof query === 'object') {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params.append(key, value.toString());
        }
      });
      const queryString = params.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    // Prepare headers
    const headers = {
      'api_key': process.env.BASE44_API_KEY,
      'Content-Type': 'application/json'
    };

    // Prepare request options
    const requestOptions = {
      method: method.toUpperCase(),
      headers
    };

    // Add body for POST/PUT requests
    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`[Base44 Proxy] ${method.toUpperCase()} ${fullUrl}`);
    console.log('[Base44 Proxy] Request headers:', headers);
    console.log('[Base44 Proxy] Request options:', requestOptions);

    // Make request to Base44 API
    const response = await fetch(fullUrl, requestOptions);

    console.log(`[Base44 Proxy] Response status: ${response.status} ${response.statusText}`);
    console.log('[Base44 Proxy] Response headers:', Object.fromEntries(response.headers.entries()));

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Base44 Proxy] Error response:', errorText);
      return res.status(response.status).json({
        error: `Base44 API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    // For DELETE requests, return success status
    if (method.toUpperCase() === 'DELETE') {
      console.log('[Base44 Proxy] DELETE successful');
      return res.status(200).json({ success: true, message: 'Deleted successfully' });
    }

    // Parse and return JSON response
    const data = await response.json();
    console.log('[Base44 Proxy] Response data received');

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Base44 Proxy] Request failed:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}