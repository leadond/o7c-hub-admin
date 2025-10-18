import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Recruiting = () => {
  const { userData } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruitingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/base44', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'GET',
            path: '/RecruitingInterest'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const prospectsData = data?.data || data || [];
          setProspects(Array.isArray(prospectsData) ? prospectsData : []);
        } else {
          console.error('Failed to fetch recruiting data:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching recruiting data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecruitingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading recruiting data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Recruiting</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Prospect
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Active Prospects</h3>
          <p className="text-3xl font-bold text-blue-600">{prospects.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Committed</h3>
          <p className="text-3xl font-bold text-green-600">{prospects.filter(p => p.status === 'committed').length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Prospects</h3>
          <p className="text-3xl font-bold text-purple-600">{prospects.length}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recruiting Pipeline</h2>
        </div>
        <div className="p-6">
          {prospects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No prospects in pipeline yet.</p>
              <p className="text-sm text-gray-400 mt-2">Add prospects to start recruiting.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {prospects.map((prospect) => (
                <div key={prospect.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{prospect.playerName || 'Unknown Player'}</h3>
                      <p className="text-sm text-gray-600">{prospect.position || 'Position not set'} • {prospect.schoolName || 'School not set'}</p>
                      <p className="text-sm text-gray-500">Interest Level: {prospect.interestLevel || 'Not set'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prospect.status === 'committed' 
                          ? 'bg-green-100 text-green-800'
                          : prospect.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {prospect.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recruiting;