import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Recruiting from './pages/Recruiting';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Protected routes with Firebase auth */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin', 'coach']}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/roster" element={
            <ProtectedRoute allowedRoles={['admin', 'coach']}>
              <Layout>
                <Roster />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/recruiting" element={
            <ProtectedRoute allowedRoles={['admin', 'coach']}>
              <Layout>
                <Recruiting />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;