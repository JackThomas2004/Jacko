import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { createLobby, getLobby, getFriends } from '../api/client';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFriends().then((res) => setFriends(res.data.friends)).catch(() => {});
  }, []);

  async function handleCreate() {
    setError('');
    setLoading(true);
    try {
      const res = await createLobby({ maxPlayers });
      navigate(`/lobby/${res.data.lobby.code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create lobby');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    if (!joinCode.trim()) return;
    try {
      await getLobby(joinCode.trim().toUpperCase());
      navigate(`/lobby/${joinCode.trim().toUpperCase()}`);
    } catch {
      setError('Lobby not found. Check the code and try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      <div className="flex flex-1 gap-6 p-6 max-w-5xl mx-auto w-full">
        {/* Friends list */}
        <aside className="w-64 bg-gray-800 rounded-2xl p-4 border border-gray-700 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">Friends</h2>
            <button
              onClick={() => navigate('/friends')}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Manage
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {friends.length === 0 && (
              <p className="text-gray-500 text-sm">No friends yet. Add some!</p>
            )}
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                  {f.username[0].toUpperCase()}
                </div>
                <span className="text-gray-200 text-sm truncate">{f.username}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/friends')}
            className="mt-3 text-sm text-center text-blue-400 hover:text-blue-300 border border-blue-800 rounded-xl py-2"
          >
            + Add Friends
          </button>
        </aside>

        {/* Main actions */}
        <main className="flex-1 flex flex-col items-center justify-center gap-6">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400">Ready to play?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
            {/* Create lobby */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Create Lobby</h2>
              <label className="block text-sm text-gray-400 mb-1">Players (2–8)</label>
              <input
                type="number"
                min={2}
                max={8}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2 text-white mb-4 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {loading ? 'Creating…' : 'Create Lobby'}
              </button>
            </div>

            {/* Join lobby */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4">Join Lobby</h2>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Lobby Code</label>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. J4CK09"
                    maxLength={6}
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl px-3 py-2 text-white uppercase tracking-widest text-center text-xl font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Join Lobby
                </button>
              </form>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/30 px-4 py-2 rounded-xl">{error}</p>
          )}
        </main>
      </div>
    </div>
  );
}
