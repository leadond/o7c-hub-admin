import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, userData, loading, userDataLoading, logout } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has userData and is authorized
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Setup Required</h2>
          <p className="text-gray-600">Your account is being configured. Please contact support if this persists.</p>
        </div>
      </div>
    );
  }

  // Layout is now ready to render

  // O7C Hub Layout with Navigation
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
              <h1 className="text-xl font-bold text-white">O7C Hub</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <Link 
                to="/" 
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/' 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/roster" 
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/roster' 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Roster</span>
              </Link>
              <Link 
                to="/recruiting" 
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/recruiting' 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Recruiting</span>
              </Link>
              {userData?.role === 'admin' && (
                <Link 
                  to="/users" 
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    location.pathname === '/users' 
                      ? 'text-blue-700 bg-blue-100' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>User Management</span>
                </Link>
              )}
              <Link 
                to="/api-test" 
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/api-test' 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>API Test</span>
              </Link>
            </nav>

            {/* User info */}
            <div className="p-4 border-t">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(userData?.firstName || userData?.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {userData?.firstName || userData?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{userData?.role}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = 'http://localhost:3001'}
                className="w-full mb-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                Switch to Player Portal
              </button>
              <button
                onClick={async () => {
                  await logout();
                  window.location.reload();
                }}
                className="w-full px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-64 flex-1">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;