import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import PlayerGrid from '../components/PlayerGrid';
import Card from '../components/Card';
import Scoreboard from '../components/Scoreboard';
import Chat from '../components/Chat';

/**
 * Game page — the main table screen.
 *
 * Phases handled:
 *   initial_flip  – each player flips 2 cards
 *   main          – normal turn loop
 *   final_round   – last turns before scoring
 *   round_end     – redirects to RoundSummary
 */
export default function Game() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [initialFlipSelections, setInitialFlipSelections] = useState([]);
  const [notification, setNotification] = useState('');

  function notify(msg, duration = 3000) {
    setNotification(msg);
    setTimeout(() => setNotification(''), duration);
  }

  // Reconnect on mount
  useEffect(() => {
    if (!socket) return;
    socket.emit('rejoin_game', { gameId });
  }, [socket, gameId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('game_started', ({ state, players: pl }) => {
      setGameState(state);
      setPlayers(pl);
    });

    socket.on('turn_result', (state) => setGameState(state));

    socket.on('cards_flipped', ({ userId }) => {
      if (userId !== user.id) notify(`${players.find((p) => p.userId === userId)?.username} flipped their cards`);
    });

    socket.on('game_phase_started', ({ currentPlayerId }) => {
      const name = players.find((p) => p.userId === currentPlayerId)?.username;
      notify(`Game started! ${currentPlayerId === user.id ? 'You go first!' : `${name} goes first`}`);
    });

    socket.on('column_removed', ({ userId }) => {
      const name = userId === user.id ? 'You' : players.find((p) => p.userId === userId)?.username;
      notify(`🎉 ${name} completed a column!`);
    });

    socket.on('final_round_started', ({ triggeredByUserId }) => {
      const name = triggeredByUserId === user.id ? 'You' : players.find((p) => p.userId === triggeredByUserId)?.username;
      notify(`⚠️ Final round! ${name} flipped their last card. Everyone gets one more turn.`, 5000);
    });

    socket.on('round_ended', (data) => {
      navigate(`/round-summary/${gameId}`, { state: data });
    });

    socket.on('game_ended', (data) => {
      navigate(`/game-over/${gameId}`, { state: data });
    });

    socket.on('player_disconnected', ({ userId: uid }) => {
      const name = players.find((p) => p.userId === uid)?.username || 'A player';
      notify(`${name} disconnected`);
    });

    socket.on('player_reconnected', ({ userId: uid }) => {
      const name = players.find((p) => p.userId === uid)?.username || 'A player';
      notify(`${name} reconnected`);
    });

    socket.on('error', (err) => notify(`❌ ${err.message}`));

    return () => {
      ['game_started', 'turn_result', 'cards_flipped', 'game_phase_started',
        'column_removed', 'final_round_started', 'round_ended', 'game_ended',
        'player_disconnected', 'player_reconnected', 'error'].forEach((e) => socket.off(e));
    };
  }, [socket, user, players, gameId, navigate]);

  // ── Initial flip handling ─────────────────────────────────────────────

  function handleInitialFlipClick(row, col) {
    if (initialFlipSelections.length >= 2) return;
    const already = initialFlipSelections.find(([r, c]) => r === row && c === col);
    if (already) {
      setInitialFlipSelections(initialFlipSelections.filter(([r, c]) => !(r === row && c === col)));
    } else {
      const next = [...initialFlipSelections, [row, col]];
      setInitialFlipSelections(next);
      if (next.length === 2) {
        socket.emit('flip_initial_cards', { gameId, positions: next });
        setInitialFlipSelections([]);
      }
    }
  }

  // ── Main turn actions ─────────────────────────────────────────────────

  const isMyTurn = gameState?.currentPlayerId === user?.id;
  const hasDrawnCard = !!gameState?.drawnCard;
  const mustFlip = gameState?.mustFlip === user?.id;

  function drawFromDeck() {
    socket.emit('draw_from_deck', { gameId });
  }

  function takeFromDiscard() {
    socket.emit('take_from_discard', { gameId });
  }

  function discardDrawnCard() {
    socket.emit('discard_drawn_card', { gameId });
  }

  function handleMyGridClick(row, col) {
    if (!isMyTurn) return;

    if (gameState.phase === 'initial_flip') {
      handleInitialFlipClick(row, col);
      return;
    }

    if (mustFlip) {
      socket.emit('flip_facedown_card', { gameId, position: [row, col] });
      return;
    }

    if (hasDrawnCard) {
      socket.emit('swap_card', { gameId, position: [row, col] });
      return;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading game…
      </div>
    );
  }

  const myGrid = gameState.grids?.[user.id];
  const opponents = players.filter((p) => p.userId !== user.id);
  const currentPlayerName = players.find((p) => p.userId === gameState.currentPlayerId)?.username;

  return (
    <div className="min-h-screen bg-green-950 flex flex-col relative">
      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-gray-600 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-pulse">
          {notification}
        </div>
      )}

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <span className="text-white font-bold text-lg">🃏 Jacko</span>
        <span className="text-gray-300 text-sm">
          {gameState.phase === 'initial_flip'
            ? 'Flip 2 cards to start'
            : isMyTurn
            ? '⭐ Your turn!'
            : `${currentPlayerName}'s turn`}
        </span>
        <div className="w-24" />
      </div>

      {/* Opponents */}
      <div className="flex flex-wrap gap-6 justify-center p-4 border-b border-green-900">
        {opponents.map((p) => (
          <div key={p.userId} className="flex flex-col items-center gap-2">
            <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
              gameState.currentPlayerId === p.userId ? 'bg-yellow-500 text-gray-900' : 'text-gray-400'
            }`}>
              {p.username}
              {gameState.currentPlayerId === p.userId && ' ⭐'}
            </div>
            <PlayerGrid grid={gameState.grids?.[p.userId]} small />
            <span className="text-xs text-gray-500">
              Score: {gameState.cumulativeScores?.[p.userId] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Centre — draw/discard piles */}
      <div className="flex items-center justify-center gap-8 py-4">
        {/* Draw pile */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={drawFromDeck}
            disabled={!isMyTurn || hasDrawnCard || mustFlip || gameState.phase === 'initial_flip'}
            className="w-16 h-24 rounded-lg bg-green-800 border-2 border-green-600 flex items-center justify-center text-2xl disabled:opacity-40 hover:brightness-110 transition-all"
          >
            🃏
          </button>
          <span className="text-gray-400 text-xs">{gameState.drawPileCount} left</span>
        </div>

        {/* Drawn card in hand */}
        {hasDrawnCard && (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-yellow-400 mb-1">In hand</div>
            <Card card={{ ...gameState.drawnCard, faceUp: true }} selected />
            {gameState.drawnFrom === 'deck' && (
              <button
                onClick={discardDrawnCard}
                disabled={!isMyTurn}
                className="text-xs text-red-400 hover:text-red-300 mt-1"
              >
                Discard
              </button>
            )}
          </div>
        )}

        {/* Discard pile */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={takeFromDiscard}
            disabled={!isMyTurn || hasDrawnCard || mustFlip || gameState.phase === 'initial_flip'}
            className="disabled:opacity-40 hover:brightness-110 transition-all"
          >
            <Card card={gameState.discardTopCard ? { ...gameState.discardTopCard, faceUp: true } : null} />
          </button>
          <span className="text-gray-400 text-xs">Discard</span>
        </div>

        {/* Scoreboard */}
        <div className="absolute right-4 top-16">
          <Scoreboard players={players} cumulativeScores={gameState.cumulativeScores ?? {}} />
        </div>
      </div>

      {/* My grid */}
      <div className="flex flex-col items-center gap-2 p-4 mt-auto">
        <div className={`text-sm font-semibold mb-1 px-4 py-1 rounded-full ${
          isMyTurn ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300'
        }`}>
          {gameState.phase === 'initial_flip'
            ? `Select 2 cards to flip (${initialFlipSelections.length}/2 selected)`
            : isMyTurn
            ? mustFlip
              ? 'Click a face-down card to flip it'
              : hasDrawnCard
              ? 'Click a card to swap, or discard your drawn card'
              : 'Draw from deck or take from discard pile'
            : 'Your grid'}
        </div>
        <PlayerGrid
          grid={myGrid}
          isOwn
          onCardClick={
            (gameState.phase === 'initial_flip' || isMyTurn) ? handleMyGridClick : undefined
          }
        />
        <span className="text-xs text-gray-500">
          My score: {gameState.cumulativeScores?.[user.id] ?? 0}
        </span>
      </div>

      <Chat socket={socket} gameId={gameId} />
    </div>
  );
}
