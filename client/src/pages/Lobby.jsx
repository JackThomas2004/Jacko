import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getLobby } from '../api/client';
import Chat from '../components/Chat';
import Navbar from '../components/Navbar';

export default function Lobby() {
  const { code } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [gameId, setGameId] = useState(null);

  // Load initial lobby state from REST
  useEffect(() => {
    getLobby(code)
      .then((res) => setLobby(res.data.lobby))
      .catch(() => setError('Lobby not found'));
  }, [code]);

  // Join lobby room via WebSocket
  useEffect(() => {
    if (!socket || !code) return;
    socket.emit('join_lobby', { lobbyCode: code });
  }, [socket, code]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('lobby_updated', (updated) => setLobby(updated));
    socket.on('game_started', ({ gameId: gid }) => {
      setGameId(gid);
      navigate(`/game/${gid}`);
    });
    socket.on('error', (err) => setError(err.message));

    return () => {
      socket.off('lobby_updated');
      socket.off('game_started');
      socket.off('error');
    };
  }, [socket, navigate]);

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function markReady() {
    if (!socket || !lobby) return;
    socket.emit('player_ready', { lobbyId: lobby.id });
  }

  function startGame() {
    if (!socket || !lobby) return;
    socket.emit('start_game', { lobbyId: lobby.id });
  }

  const isHost = lobby?.hostId === user?.id;
  const me = lobby?.players?.find((p) => p.userId === user?.id);
  const allReady = lobby?.players?.length >= 2 && lobby?.players?.every((p) => p.isReady);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button onClick={() => navigate('/home')} className="text-blue-400 hover:underline">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading lobby…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full p-6">
        {/* Lobby code */}
        <div className="text-center mb-8">
          <p className="text-gray-400 text-sm mb-1">Share this code with your friends</p>
          <button
            onClick={copyCode}
            className="text-5xl font-bold tracking-widest text-white bg-gray-800 px-8 py-4 rounded-2xl border border-gray-600 hover:border-blue-500 transition-colors"
          >
            {code}
          </button>
          <p className="text-gray-500 text-sm mt-2">
            {copied ? '✅ Copied!' : 'Click to copy'}
          </p>
        </div>

        {/* Players */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between text-sm text-gray-400">
            <span>{lobby.players.length} / {lobby.maxPlayers} players</span>
            <span>Waiting for everyone to ready up…</span>
          </div>
          {lobby.players.map((p) => (
            <div key={p.userId} className="flex items-center justify-between px-4 py-3 border-b border-gray-700 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold text-lg">
                  {p.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {p.username}
                    {p.userId === lobby.hostId && (
                      <span className="ml-2 text-xs bg-yellow-700 text-yellow-200 px-2 py-0.5 rounded-full">Host</span>
                    )}
                  </p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${p.isReady ? 'text-green-400' : 'text-gray-500'}`}>
                {p.isReady ? '✓ Ready' : 'Not ready'}
              </span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!me?.isReady && (
            <button
              onClick={markReady}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Ready Up
            </button>
          )}
          {isHost && (
            <button
              onClick={startGame}
              disabled={!allReady}
              title={!allReady ? 'All players must be ready' : ''}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              Start Game
            </button>
          )}
          {me?.isReady && !isHost && (
            <div className="flex-1 text-center text-green-400 font-semibold py-3">
              Waiting for host to start…
            </div>
          )}
        </div>
      </div>

      <Chat socket={socket} lobbyId={lobby.id} />
    </div>
  );
}
