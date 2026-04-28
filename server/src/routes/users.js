const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/users/search?q=
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Query must be at least 2 chars' });

  try {
    const users = await prisma.user.findMany({
      where: {
        username: { contains: q.trim(), mode: 'insensitive' },
        NOT: { id: req.userId },
      },
      take: 20,
      select: { id: true, username: true, avatarUrl: true },
    });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/v1/users/me
router.patch('/me', async (req, res) => {
  const { username, avatarUrl } = req.body;
  const data = {};
  if (username) {
    if (username.length < 2 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 2–30 characters' });
    }
    data.username = username;
  }
  if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;

  try {
    const user = await prisma.user.update({ where: { id: req.userId }, data });
    return res.json({
      user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Username already taken' });
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
