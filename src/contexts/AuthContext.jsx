import { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'undefined' && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'undefined';

let app, auth;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    auth = null;
  }
} else {
  console.warn('Firebase not configured. Please set environment variables.');
  auth = null;
}

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!auth) {
      // If Firebase is not configured, set up demo mode
      console.log('Running in demo mode - Firebase not configured');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Mock user data for now
        setUserData({
          id: user.uid,
          email: user.email,
          role: 'admin',
          status: 'approved',
          firstName: 'Admin',
          lastName: 'User'
        });
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (!auth) {
      // Demo mode - simulate login
      if (email === 'demo@example.com' && password === 'demo123') {
        const mockUser = {
          uid: 'demo-user',
          email: 'demo@example.com',
          displayName: 'Demo User'
        };
        setUser(mockUser);
        setUserData({
          id: 'demo-user',
          email: 'demo@example.com',
          role: 'admin',
          status: 'approved',
          firstName: 'Demo',
          lastName: 'User'
        });
        return { user: mockUser, userData: null };
      } else {
        throw new Error('Demo mode: Use demo@example.com / demo123');
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, userData: null };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      // Demo mode logout
      setUser(null);
      setUserData(null);
      return;
    }
    await signOut(auth);
  };

  const value = {
    user,
    userData,
    loading,
    userDataLoading: false,
    isAuthorized: !!user,
    login,
    logout,
    isDemo: !auth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};