import { useState, useEffect } from 'react';

// Simple Card components for Dashboard
const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-medium ${className}`}>
    {children}
  </h3>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeTeams: 0,
    pendingApprovals: 0,
    recruitingLeads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch players
        const playersResponse = await fetch('/api/base44', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'GET',
            path: '/Player'
          })
        });
        
        // Fetch teams
        const teamsResponse = await fetch('/api/base44', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'GET',
            path: '/Team'
          })
        });

        // Fetch users for pending approvals
        const usersResponse = await fetch('/api/base44', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'GET',
            path: '/AppUser'
          })
        });

        // Fetch recruiting interests
        const recruitingResponse = await fetch('/api/base44', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'GET',
            path: '/RecruitingInterest'
          })
        });

        const [players, teams, users, recruiting] = await Promise.all([
          playersResponse.json(),
          teamsResponse.json(),
          usersResponse.json(),
          recruitingResponse.json()
        ]);

        // Calculate stats
        const playersData = players?.data || players || [];
        const teamsData = teams?.data || teams || [];
        const usersData = users?.data || users || [];
        const recruitingData = recruiting?.data || recruiting || [];

        setStats({
          totalPlayers: Array.isArray(playersData) ? playersData.length : 0,
          activeTeams: Array.isArray(teamsData) ? teamsData.length : 0,
          pendingApprovals: Array.isArray(usersData) ? usersData.filter(u => u.status === 'pending').length : 0,
          recruitingLeads: Array.isArray(recruitingData) ? recruitingData.length : 0
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">O7C Hub Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading dashboard data: {error}</p>
          <p className="text-sm text-red-600 mt-2">Check your Base44 API configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">O7C Hub Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPlayers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recruiting Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.recruitingLeads}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;