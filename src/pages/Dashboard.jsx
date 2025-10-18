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
        console.log('Dashboard: Starting data fetch...');
        
        // Test Base44 API connection first
        console.log('Dashboard: Testing Base44 API connection...');
        const testResponse = await fetch('/api/base44', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'GET',
            path: '/Player'
          })
        });

        console.log('Dashboard: Base44 API response status:', testResponse.status);
        
        if (!testResponse.ok) {
          const errorData = await testResponse.json();
          console.error('Dashboard: Base44 API error:', errorData);
          throw new Error(`Base44 API Error: ${errorData.error || 'Unknown error'}`);
        }

        const testData = await testResponse.json();
        console.log('Dashboard: Base44 API test response:', testData);
        
        // Fetch all data
        const [playersResponse, teamsResponse, usersResponse, recruitingResponse] = await Promise.all([
          fetch('/api/base44', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'GET', path: '/Player' })
          }),
          fetch('/api/base44', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'GET', path: '/Team' })
          }),
          fetch('/api/base44', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'GET', path: '/AppUser' })
          }),
          fetch('/api/base44', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'GET', path: '/RecruitingInterest' })
          })
        ]);

        const [players, teams, users, recruiting] = await Promise.all([
          playersResponse.json(),
          teamsResponse.json(),
          usersResponse.json(),
          recruitingResponse.json()
        ]);

        console.log('Dashboard: Fetched data:', { players, teams, users, recruiting });

        // Calculate stats
        const playersData = players?.data || players || [];
        const teamsData = teams?.data || teams || [];
        const usersData = users?.data || users || [];
        const recruitingData = recruiting?.data || recruiting || [];

        console.log('Dashboard: Processed data:', { 
          playersCount: playersData.length, 
          teamsCount: teamsData.length,
          usersCount: usersData.length,
          recruitingCount: recruitingData.length
        });

        setStats({
          totalPlayers: Array.isArray(playersData) ? playersData.length : 0,
          activeTeams: Array.isArray(teamsData) ? teamsData.length : 0,
          pendingApprovals: Array.isArray(usersData) ? usersData.filter(u => u.status === 'pending').length : 0,
          recruitingLeads: Array.isArray(recruitingData) ? recruitingData.length : 0
        });

      } catch (err) {
        console.error('Dashboard: Error fetching data:', err);
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
          <p className="text-sm text-red-600 mt-2">Check your Base44 API configuration in Vercel environment variables.</p>
          <div className="mt-4 text-xs text-red-600">
            <p>Required environment variables:</p>
            <ul className="list-disc list-inside mt-1">
              <li>BASE44_API_KEY</li>
              <li>BASE44_APP_ID</li>
            </ul>
          </div>
        </div>
        
        {/* Debug info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 font-medium">Debug Information:</p>
          <p className="text-sm text-yellow-700 mt-1">Check browser console for detailed error logs.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
          >
            Retry
          </button>
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