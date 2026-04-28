const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/v1/friends — list accepted friends
router.get('/', async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: req.userId }, { addresseeId: req.userId }],
      },
      include: { requester: true, addressee: true },
    });

    const friends = friendships.map((f) => {
      const friend = f.requesterId === req.userId ? f.addressee : f.requester;
      return { id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl };
    });

    return res.json({ friends });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/friends/requests/incoming
router.get('/requests/incoming', async (req, res) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { addresseeId: req.userId, status: 'pending' },
      include: { requester: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/friends/request/:userId
router.post('/request/:userId', async (req, res) => {
  const addresseeId = req.params.userId;
  if (addresseeId === req.userId) return res.status(400).json({ error: 'Cannot friend yourself' });

  try {
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.userId, addresseeId },
          { requesterId: addresseeId, addresseeId: req.userId },
        ],
      },
    });
    if (existing) return res.status(409).json({ error: 'Request already exists' });

    const friendship = await prisma.friendship.create({
      data: { id: uuidv4(), requesterId: req.userId, addresseeId },
    });
    return res.status(201).json({ friendship });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/friends/accept/:requestId
router.post('/accept/:requestId', async (req, res) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.requestId } });
    if (!friendship || friendship.addresseeId !== req.userId) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const updated = await prisma.friendship.update({
      where: { id: req.params.requestId },
      data: { status: 'accepted' },
    });
    return res.json({ friendship: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/friends/decline/:requestId
router.post('/decline/:requestId', async (req, res) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.requestId } });
    if (!friendship || friendship.addresseeId !== req.userId) {
      return res.status(404).json({ error: 'Request not found' });
    }
    const updated = await prisma.friendship.update({
      where: { id: req.params.requestId },
      data: { status: 'declined' },
    });
    return res.json({ friendship: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/friends/:userId
router.delete('/:userId', async (req, res) => {
  try {
    await prisma.friendship.deleteMany({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: req.userId, addresseeId: req.params.userId },
          { requesterId: req.params.userId, addresseeId: req.userId },
        ],
      },
    });
    return res.json({ message: 'Friend removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
