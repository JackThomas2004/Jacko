const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/v1/lobbies — create a new lobby
router.post('/', async (req, res) => {
  const maxPlayers = parseInt(req.body.maxPlayers ?? 4);
  if (maxPlayers < 2 || maxPlayers > 8) {
    return res.status(400).json({ error: 'maxPlayers must be between 2 and 8' });
  }

  try {
    let code = generateCode();
    // Ensure unique code
    while (await prisma.lobby.findUnique({ where: { code } })) {
      code = generateCode();
    }

    const lobby = await prisma.lobby.create({
      data: {
        id: uuidv4(),
        code,
        hostId: req.userId,
        maxPlayers,
        members: { create: { userId: req.userId } },
      },
      include: { members: { include: { user: true } } },
    });

    return res.status(201).json({ lobby: formatLobby(lobby) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/lobbies/:code
router.get('/:code', async (req, res) => {
  try {
    const lobby = await prisma.lobby.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: { members: { include: { user: true } } },
    });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    return res.json({ lobby: formatLobby(lobby) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/lobbies/:id — close a lobby (host only)
router.delete('/:id', async (req, res) => {
  try {
    const lobby = await prisma.lobby.findUnique({ where: { id: req.params.id } });
    if (!lobby) return res.status(404).json({ error: 'Lobby not found' });
    if (lobby.hostId !== req.userId) return res.status(403).json({ error: 'Only the host can close the lobby' });

    await prisma.lobby.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Lobby closed' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

function formatLobby(lobby) {
  return {
    id: lobby.id,
    code: lobby.code,
    hostId: lobby.hostId,
    status: lobby.status,
    maxPlayers: lobby.maxPlayers,
    createdAt: lobby.createdAt,
    players: lobby.members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      isReady: m.isReady,
    })),
  };
}

module.exports = router;
