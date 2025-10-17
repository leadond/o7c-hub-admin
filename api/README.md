# Vercel API Functions

This directory contains Vercel serverless functions that proxy external API calls to protect sensitive API keys from client-side exposure.

## Available Endpoints

### `/api/base44`
Proxies requests to Base44 API for data operations.

**Method:** POST
**Body:**
```json
{
  "method": "GET|POST|PUT|DELETE",
  "path": "/entities/EntityName" | "/entities/EntityName/id",
  "body": { ... }, // for POST/PUT requests
  "query": { "key": "value" } // for GET requests with query params
}
```

**Environment Variables Required:**
- `BASE44_API_KEY`
- `BASE44_APP_ID`

### `/api/huggingface`
Proxies requests to HuggingFace Inference API for AI/ML operations.

**Method:** POST
**Body:**
```json
{
  "model": "gpt2", // optional, defaults to gpt2
  "inputs": "Your prompt text",
  "options": { ... } // optional
}
```

**Environment Variables Required:**
- `HUGGINGFACE_API_TOKEN` (server-side, recommended)
- `VITE_HUGGINGFACE_API_TOKEN` (legacy client-side, supported for backward compatibility)

**Token Format:**
- Must start with `hf_` followed by 34 alphanumeric characters
- Example: `hf_abcdefghijklmnopqrstuvwxyz1234567890`
- Get your token at: https://huggingface.co/settings/tokens

**Error Handling:**
The endpoint provides detailed error responses for common issues:
- `MISSING_TOKEN`: Token not configured in environment
- `INVALID_TOKEN_FORMAT`: Token doesn't match expected format
- `UNAUTHORIZED`: Token is invalid or expired
- `RATE_LIMITED`: Too many requests

**Troubleshooting:** For detailed authentication troubleshooting, see [HUGGINGFACE_TROUBLESHOOTING.md](../HUGGINGFACE_TROUBLESHOOTING.md)

### `/api/brevo`
Proxies requests to Brevo (Sendinblue) API for email operations.

**Method:** POST
**Body:**
```json
{
  "endpoint": "/v3/smtp/email", // optional, defaults to /v3/smtp/email
  "payload": {
    "sender": { "email": "from@example.com", "name": "Sender Name" },
    "to": [{ "email": "to@example.com" }],
    "subject": "Email Subject",
    "htmlContent": "<p>Email content</p>",
    "textContent": "Plain text content" // optional
  }
}
```

**Environment Variables Required:**
- `BREVO_API_KEY`

## Security Notes

- All functions only accept POST requests for security
- API keys are stored server-side as environment variables
- Client-side code should call these proxy endpoints instead of external APIs directly
- Functions include proper error handling and logging

## Usage in Client Code

Update your client-side API calls to use these proxy endpoints:

```javascript
// Instead of:
// fetch('https://api.brevo.com/v3/smtp/email', { ... })

// Use:
// fetch('/api/brevo', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ payload: emailPayload })
// })
```

## Deployment

These functions will automatically deploy with Vercel when pushed to your repository. Make sure to set the required environment variables in your Vercel project settings.