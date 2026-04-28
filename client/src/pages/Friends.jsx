import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
  getFriends,
  getIncomingRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../api/client';

export default function Friends() {
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  async function loadFriends() {
    const res = await getFriends().catch(() => ({ data: { friends: [] } }));
    setFriends(res.data.friends);
  }

  async function loadRequests() {
    const res = await getIncomingRequests().catch(() => ({ data: { requests: [] } }));
    setIncoming(res.data.requests);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (search.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await searchUsers(search.trim());
      setResults(res.data.users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendRequest(userId) {
    setError('');
    try {
      await sendFriendRequest(userId);
      setResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send request');
    }
  }

  async function handleAccept(requestId) {
    await acceptFriendRequest(requestId);
    await Promise.all([loadFriends(), loadRequests()]);
  }

  async function handleDecline(requestId) {
    await declineFriendRequest(requestId);
    loadRequests();
  }

  async function handleRemove(userId) {
    await removeFriend(userId);
    loadFriends();
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Friends</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username…"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold"
          >
            Search
          </button>
        </form>

        {results.length > 0 && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 mb-6 overflow-hidden">
            {results.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="text-white">{u.username}</span>
                </div>
                <button
                  onClick={() => handleSendRequest(u.id)}
                  className="bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1 rounded-lg"
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['friends', 'pending'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t === 'pending' ? `Pending${incoming.length > 0 ? ` (${incoming.length})` : ''}` : 'Friends'}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          {tab === 'friends' && (
            <>
              {friends.length === 0 && (
                <p className="text-gray-500 text-center py-8">No friends yet. Search for players above!</p>
              )}
              {friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                      {f.username[0].toUpperCase()}
                    </div>
                    <span className="text-white">{f.username}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(f.id)}
                    className="text-gray-500 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </>
          )}

          {tab === 'pending' && (
            <>
              {incoming.length === 0 && (
                <p className="text-gray-500 text-center py-8">No pending requests.</p>
              )}
              {incoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center font-bold">
                      {r.requester.username[0].toUpperCase()}
                    </div>
                    <span className="text-white">{r.requester.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(r.id)}
                      className="bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(r.id)}
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded-lg"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
