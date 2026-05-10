const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/v1/availability/:spaceId  — public ─────────────────────────────
router.get('/:spaceId', async (req, res) => {
  try {
    const space = await prisma.space.findUnique({ where: { id: req.params.spaceId } });
    if (!space) return res.status(404).json({ error: 'Space not found' });

    const availability = await prisma.availability.findMany({
      where: { spaceId: req.params.spaceId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return res.json({ availability });
  } catch (err) {
    console.error('[availability GET /:spaceId]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUT /api/v1/availability/:spaceId  — replace schedule (owner only) ───────
// Body: { schedule: [{ dayOfWeek: 0-6, startTime: "08:00", endTime: "20:00" }] }
// Days not included in schedule are treated as unavailable (no record stored).
// To mark a day unavailable, omit it from the schedule array.
router.put('/:spaceId', authMiddleware, async (req, res) => {
  const { schedule } = req.body;

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'schedule must be an array' });
  }

  // Validate each entry
  for (const entry of schedule) {
    const { dayOfWeek, startTime, endTime } = entry;
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'dayOfWeek must be an integer 0 (Sun) through 6 (Sat)' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Each schedule entry requires startTime and endTime (e.g. "08:00")' });
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return res.status(400).json({ error: 'startTime and endTime must be in HH:MM format' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: `startTime must be before endTime for day ${dayOfWeek}` });
    }
  }

  try {
    const space = await prisma.space.findUnique({ where: { id: req.params.spaceId } });
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    // Replace all availability records for this space in a transaction
    const availability = await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { spaceId: req.params.spaceId } });

      if (schedule.length === 0) return [];

      const records = schedule.map(({ dayOfWeek, startTime, endTime }) => ({
        id: uuidv4(),
        spaceId: req.params.spaceId,
        dayOfWeek,
        startTime,
        endTime,
      }));

      await tx.availability.createMany({ data: records });

      return tx.availability.findMany({
        where: { spaceId: req.params.spaceId },
        orderBy: { dayOfWeek: 'asc' },
      });
    });

    return res.json({ availability });
  } catch (err) {
    console.error('[availability PUT /:spaceId]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
