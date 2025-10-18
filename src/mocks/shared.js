// Temporary mock implementations for shared components

// Mock auth hook
export const useAuth = () => ({
  user: { uid: 'mock-user', email: 'admin@example.com' },
  userData: { role: 'admin', status: 'approved' },
  loading: false,
  userDataLoading: false,
  isAuthorized: true,
  login: async () => ({ user: null, userData: null }),
  logout: async () => {}
});

// Mock UI components
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-medium ${className}`}>
    {children}
  </h3>
);

// Mock utility functions
export const shouldRedirectUser = () => false;
export const getRedirectUrl = () => '/';
export const hasPermission = () => true;
export const hasAnyPermission = () => true;