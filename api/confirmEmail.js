import { list as listUsers, update as updateUser } from '@/api/entities/AppUser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Confirmation token required' });
    }

    // Find user by confirmation token
    const users = await listUsers();
    const user = users.find(u => u.confirmationToken === token);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Invalid or expired confirmation token' });
    }

    // Check if token is expired (24 hours)
    const tokenCreated = new Date(user.confirmationTokenCreated || user.createdAt);
    const now = new Date();
    const hoursDiff = (now - tokenCreated) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return res.status(400).json({ success: false, error: 'Confirmation token has expired' });
    }

    // Update user status
    await updateUser(user.id, {
      emailConfirmed: true,
      emailConfirmedAt: new Date().toISOString(),
      invitationStatus: 'pending',
      status: 'pending_admin_approval',
      confirmationToken: null,
      confirmationTokenCreated: null
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Email confirmed successfully. Your account is now pending admin approval.' 
    });

  } catch (error) {
    console.error('Error confirming email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}