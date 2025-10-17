import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "o7chub",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || "o7chub"
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action, firebaseUid, updates, customClaims, maxResults, pageToken } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    switch (action) {
      case 'get':
        if (!firebaseUid) {
          return res.status(400).json({ success: false, error: 'Firebase UID is required' });
        }
        const userRecord = await admin.auth().getUser(firebaseUid);
        return res.status(200).json({
          success: true,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            disabled: userRecord.disabled,
            emailVerified: userRecord.emailVerified,
            customClaims: userRecord.customClaims,
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            lastRefreshTime: userRecord.metadata.lastRefreshTime
          }
        });

      case 'list':
        const listUsersResult = await admin.auth().listUsers(maxResults || 100, pageToken);
        const users = listUsersResult.users.map(userRecord => ({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          customClaims: userRecord.customClaims,
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: userRecord.metadata.lastRefreshTime,
          providerData: userRecord.providerData.map(provider => ({
            uid: provider.uid,
            email: provider.email,
            providerId: provider.providerId
          }))
        }));
        return res.status(200).json({
          success: true,
          users,
          pageToken: listUsersResult.pageToken,
          totalUsers: users.length
        });

      case 'update':
        if (!firebaseUid) {
          return res.status(400).json({ success: false, error: 'Firebase UID is required' });
        }
        if (!updates || typeof updates !== 'object') {
          return res.status(400).json({ success: false, error: 'Updates object is required' });
        }
        const allowedFields = ['email', 'displayName', 'disabled', 'emailVerified', 'password'];
        const updateData = {};
        for (const [key, value] of Object.entries(updates)) {
          if (allowedFields.includes(key)) {
            updateData[key] = value;
          }
        }
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'No valid update fields provided. Allowed fields: ' + allowedFields.join(', ')
          });
        }
        const updatedUserRecord = await admin.auth().updateUser(firebaseUid, updateData);
        return res.status(200).json({
          success: true,
          user: {
            uid: updatedUserRecord.uid,
            email: updatedUserRecord.email,
            displayName: updatedUserRecord.displayName,
            disabled: updatedUserRecord.disabled,
            emailVerified: updatedUserRecord.emailVerified
          },
          updatedFields: Object.keys(updateData)
        });

      case 'delete':
        if (!firebaseUid) {
          return res.status(400).json({ success: false, error: 'Firebase UID is required' });
        }
        await admin.auth().deleteUser(firebaseUid);
        return res.status(200).json({
          success: true,
          message: `Firebase user ${firebaseUid} deleted successfully`,
          deletedUid: firebaseUid,
          deletedAt: new Date().toISOString()
        });

      case 'setCustomClaims':
        if (!firebaseUid) {
          return res.status(400).json({ success: false, error: 'Firebase UID is required' });
        }
        if (!customClaims || typeof customClaims !== 'object') {
          return res.status(400).json({ success: false, error: 'Custom claims object is required' });
        }
        const claimsString = JSON.stringify(customClaims);
        if (claimsString.length > 1000) {
          return res.status(400).json({
            success: false,
            error: 'Custom claims exceed 1000 character limit'
          });
        }
        await admin.auth().setCustomUserClaims(firebaseUid, customClaims);
        return res.status(200).json({
          success: true,
          message: 'Custom claims set successfully',
          customClaims
        });

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`Error in firebase-user API (action: ${req.body.action}):`, error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process request'
    });
  }
}