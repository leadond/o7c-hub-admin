import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Roster from './pages/Roster';
import Recruiting from './pages/Recruiting';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Temporarily remove auth - direct access to all routes */}
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/roster" element={
          <Layout>
            <Roster />
          </Layout>
        } />
        <Route path="/recruiting" element={
          <Layout>
            <Recruiting />
          </Layout>
        } />
        <Route path="/users" element={
          <Layout>
            <UserManagement />
          </Layout>
        } />
      </Routes>
    </Router>
  );
}

export default App;