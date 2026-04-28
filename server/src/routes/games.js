const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/games/history — current user's game history
router.get('/history', async (req, res) => {
  try {
    const scores = await prisma.gameScore.findMany({
      where: { userId: req.userId },
      include: { game: { include: { lobby: true } } },
      orderBy: { game: { startedAt: 'desc' } },
      take: 50,
    });

    // Group by game
    const gamesMap = {};
    for (const s of scores) {
      if (!gamesMap[s.gameId]) {
        gamesMap[s.gameId] = {
          gameId: s.gameId,
          startedAt: s.game.startedAt,
          endedAt: s.game.endedAt,
          winnerId: s.game.winnerId,
          rounds: [],
        };
      }
      gamesMap[s.gameId].rounds.push({
        roundNumber: s.roundNumber,
        roundScore: s.roundScore,
        totalScore: s.totalScore,
      });
    }

    return res.json({ games: Object.values(gamesMap) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/games/:id
router.get('/:id', async (req, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: {
        scores: { include: { user: { select: { id: true, username: true } } } },
        winner: { select: { id: true, username: true } },
      },
    });
    if (!game) return res.status(404).json({ error: 'Game not found' });
    return res.json({ game });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
