/**
 * All Socket.io event handlers for in-game and lobby events.
 * Imported once in socket.js and bound to each connected socket.
 */

const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const { getGameState, setGameState } = require('../lib/redis');
const {
  createGameState,
  handleFlipInitialCards,
  handleDrawFromDeck,
  handleTakeFromDiscard,
  handleSwapCard,
  handleDiscardDrawnCard,
  handleFlipFacedownCard,
  buildTurnPayload,
} = require('./gameEngine');

// ---------------------------------------------------------------------------
// Helper — emit events returned from the game engine
// ---------------------------------------------------------------------------
function emitEvents(io, roomId, events) {
  for (const ev of events) {
    io.to(roomId).emit(ev.name, ev.data);
  }
}

function gameRoom(gameId) {
  return `game:${gameId}`;
}

function lobbyRoom(lobbyId) {
  return `lobby:${lobbyId}`;
}

// ---------------------------------------------------------------------------
// Register all handlers for a socket
// ---------------------------------------------------------------------------
function registerHandlers(io, socket) {
  const userId = socket.userId; // set in socket.js during auth handshake

  // ── Lobby ──────────────────────────────────────────────────────────────

  socket.on('join_lobby', async ({ lobbyCode }) => {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { code: lobbyCode },
        include: { members: { include: { user: true } } },
      });
      if (!lobby) return socket.emit('error', { code: 'NOT_FOUND', message: 'Lobby not found' });
      if (lobby.status !== 'waiting') return socket.emit('error', { code: 'LOBBY_STARTED', message: 'Game already in progress' });
      if (lobby.members.length >= lobby.maxPlayers && !lobby.members.find((m) => m.userId === userId)) {
        return socket.emit('error', { code: 'LOBBY_FULL', message: 'Lobby is full' });
      }

      // Add to DB if not already a member
      const alreadyIn = lobby.members.find((m) => m.userId === userId);
      if (!alreadyIn) {
        await prisma.lobbyMember.create({ data: { lobbyId: lobby.id, userId } });
      }

      socket.join(lobbyRoom(lobby.id));

      // Broadcast updated lobby state
      const updated = await prisma.lobby.findUnique({
        where: { id: lobby.id },
        include: { members: { include: { user: true } } },
      });
      io.to(lobbyRoom(lobby.id)).emit('lobby_updated', formatLobby(updated));
    } catch (err) {
      console.error('join_lobby error:', err);
      socket.emit('error', { code: 'SERVER_ERROR', message: err.message });
    }
  });

  socket.on('player_ready', async ({ lobbyId }) => {
    try {
      await prisma.lobbyMember.update({
        where: { lobbyId_userId: { lobbyId, userId } },
        data: { isReady: true },
      });
      const lobby = await prisma.lobby.findUnique({
        where: { id: lobbyId },
        include: { members: { include: { user: true } } },
      });
      io.to(lobbyRoom(lobbyId)).emit('lobby_updated', formatLobby(lobby));
    } catch (err) {
      socket.emit('error', { code: 'SERVER_ERROR', message: err.message });
    }
  });

  socket.on('start_game', async ({ lobbyId }) => {
    try {
      const lobby = await prisma.lobby.findUnique({
        where: { id: lobbyId },
        include: { members: { include: { user: true } } },
      });
      if (!lobby) return socket.emit('error', { code: 'NOT_FOUND', message: 'Lobby not found' });
      if (lobby.hostId !== userId) return socket.emit('error', { code: 'FORBIDDEN', message: 'Only the host can start the game' });
      if (!lobby.members.every((m) => m.isReady)) {
        return socket.emit('error', { code: 'NOT_READY', message: 'Not all players are ready' });
      }
      if (lobby.members.length < 2) {
        return socket.emit('error', { code: 'TOO_FEW', message: 'Need at least 2 players' });
      }

      // Create game in DB
      const game = await prisma.game.create({ data: { id: uuidv4(), lobbyId } });

      // Update lobby status
      await prisma.lobby.update({ where: { id: lobbyId }, data: { status: 'in_progress' } });

      // Build initial game state in Redis
      const players = lobby.members.map((m) => ({
        userId: m.userId,
        username: m.user.username,
      }));
      const gameState = createGameState(game.id, lobbyId, players);
      await setGameState(game.id, gameState);

      // Move all lobby sockets into the game room
      const sockets = await io.in(lobbyRoom(lobbyId)).fetchSockets();
      for (const s of sockets) {
        s.join(gameRoom(game.id));
      }

      io.to(gameRoom(game.id)).emit('game_started', {
        gameId: game.id,
        state: buildTurnPayload(gameState),
        players: gameState.players,
      });
    } catch (err) {
      console.error('start_game error:', err);
      socket.emit('error', { code: 'SERVER_ERROR', message: err.message });
    }
  });

  // ── Game actions ───────────────────────────────────────────────────────

  async function runAction(gameId, fn) {
    const state = await getGameState(gameId);
    if (!state) return socket.emit('error', { code: 'NOT_FOUND', message: 'Game not found' });

    const result = fn(state);
    if (result.error) return socket.emit('error', { code: 'INVALID_ACTION', message: result.error });

    await setGameState(gameId, result.state);
    emitEvents(io, gameRoom(gameId), result.events);

    // If game ended, persist scores to DB
    const gameEnded = result.events.find((e) => e.name === 'game_ended');
    if (gameEnded) {
      await persistGameEnd(result.state, gameEnded.data);
    } else {
      // Persist round scores if round ended
      const roundEnded = result.events.find((e) => e.name === 'round_ended');
      if (roundEnded) {
        await persistRoundScores(gameId, result.state, roundEnded.data);
      }
    }
  }

  socket.on('flip_initial_cards', async ({ gameId, positions }) => {
    await runAction(gameId, (s) => handleFlipInitialCards(s, userId, positions));
  });

  socket.on('draw_from_deck', async ({ gameId }) => {
    await runAction(gameId, (s) => handleDrawFromDeck(s, userId));
  });

  socket.on('take_from_discard', async ({ gameId }) => {
    await runAction(gameId, (s) => handleTakeFromDiscard(s, userId));
  });

  socket.on('swap_card', async ({ gameId, position }) => {
    await runAction(gameId, (s) => handleSwapCard(s, userId, position));
  });

  socket.on('discard_drawn_card', async ({ gameId }) => {
    await runAction(gameId, (s) => handleDiscardDrawnCard(s, userId));
  });

  socket.on('flip_facedown_card', async ({ gameId, position }) => {
    await runAction(gameId, (s) => handleFlipFacedownCard(s, userId, position));
  });

  // ── Chat ───────────────────────────────────────────────────────────────

  socket.on('send_chat_message', ({ lobbyId, gameId, message }) => {
    if (!message || typeof message !== 'string') return;
    const trimmed = message.trim().slice(0, 200);
    const room = gameId ? gameRoom(gameId) : lobbyRoom(lobbyId);
    io.to(room).emit('chat_message', {
      userId,
      message: trimmed,
      ts: Date.now(),
    });
  });

  // ── Disconnect ─────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    // Notify all rooms this socket was in
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        io.to(room).emit('player_disconnected', { userId });
      }
    });
  });

  socket.on('rejoin_game', async ({ gameId }) => {
    const state = await getGameState(gameId);
    if (!state) return;
    const isPlayer = state.players.find((p) => p.userId === userId);
    if (!isPlayer) return;

    socket.join(gameRoom(gameId));
    socket.emit('turn_result', buildTurnPayload(state));
    io.to(gameRoom(gameId)).emit('player_reconnected', { userId });
  });
}

// ---------------------------------------------------------------------------
// DB persistence helpers
// ---------------------------------------------------------------------------

async function persistRoundScores(gameId, state, roundData) {
  const { roundNumber, roundScores, cumulativeScores } = roundData;
  const records = Object.entries(roundScores).map(([uid, rs]) => ({
    id: uuidv4(),
    gameId,
    userId: uid,
    roundNumber,
    roundScore: rs,
    totalScore: cumulativeScores[uid],
  }));
  await prisma.gameScore.createMany({ data: records });
}

async function persistGameEnd(state, gameEndData) {
  const { winnerId } = gameEndData;
  await prisma.game.update({
    where: { id: state.gameId },
    data: { winnerId, endedAt: new Date() },
  });
  await prisma.lobby.update({
    where: { id: state.lobbyId },
    data: { status: 'finished' },
  });
}

function formatLobby(lobby) {
  return {
    id: lobby.id,
    code: lobby.code,
    hostId: lobby.hostId,
    maxPlayers: lobby.maxPlayers,
    status: lobby.status,
    players: lobby.members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      isReady: m.isReady,
    })),
  };
}

module.exports = { registerHandlers };
