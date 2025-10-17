import { useState, useEffect } from 'react';
import { useAuth } from '@o7c/shared';

const Roster = () => {
  const { userData } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch roster data
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading roster...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Team Roster</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Player
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Players</h2>
        </div>
        <div className="p-6">
          {players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No players in roster yet.</p>
              <p className="text-sm text-gray-400 mt-2">Add players to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {players.map((player) => (
                <div key={player.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{player.name}</h3>
                  <p className="text-sm text-gray-600">{player.position}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roster;