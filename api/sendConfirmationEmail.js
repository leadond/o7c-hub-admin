export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, confirmationToken, userName } = req.body;

    if (!email || !confirmationToken) {
      return res.status(400).json({ success: false, error: 'Email and confirmation token required' });
    }

    const confirmationUrl = `${process.env.VERCEL_URL || 'http://localhost:5173'}/confirm-email?token=${confirmationToken}`;

    const emailData = {
      sender: { email: 'noreply@o7chub.com', name: 'O7C Hub' },
      to: [{ email, name: userName || 'User' }],
      subject: 'Confirm Your O7C Hub Account',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Welcome to O7C Hub!</h2>
          <p>Thank you for signing up. Please confirm your email address to continue with your account setup.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link: <br>
            <a href="${confirmationUrl}">${confirmationUrl}</a>
          </p>
          <p style="color: #666; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create this account, please ignore this email.
          </p>
        </div>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: 'Confirmation email sent' });
    } else {
      const error = await response.text();
      return res.status(500).json({ success: false, error: 'Failed to send email: ' + error });
    }

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}