const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/bookings  – create a booking
router.post('/', authMiddleware, async (req, res) => {
  const { spaceId, startTime, endTime, notes } = req.body;
  if (!spaceId || !startTime || !endTime) {
    return res.status(400).json({ error: 'spaceId, startTime, and endTime are required' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start) || isNaN(end) || start >= end) {
    return res.status(400).json({ error: 'Invalid time range' });
  }
  if (start < new Date()) {
    return res.status(400).json({ error: 'Start time must be in the future' });
  }

  try {
    const space = await prisma.space.findUnique({ where: { id: spaceId } });
    if (!space || !space.isActive) return res.status(404).json({ error: 'Space not found or unavailable' });
    if (space.ownerId === req.userId) return res.status(400).json({ error: 'You cannot book your own space' });

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        spaceId,
        status: { in: ['pending', 'confirmed'] },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });
    if (conflict) return res.status(409).json({ error: 'Space is already booked for that time period' });

    const hours = (end - start) / (1000 * 60 * 60);
    let totalPrice;
    if (hours >= 20 && space.pricePerDay) {
      const days = Math.ceil(hours / 24);
      totalPrice = days * space.pricePerDay;
    } else if (space.pricePerHour) {
      totalPrice = Math.ceil(hours) * space.pricePerHour;
    } else {
      const days = Math.ceil(hours / 24);
      totalPrice = days * space.pricePerDay;
    }

    const booking = await prisma.booking.create({
      data: {
        id: uuidv4(),
        spaceId,
        renterId: req.userId,
        startTime: start,
        endTime: end,
        totalPrice,
        notes: notes || null,
        status: 'pending',
      },
      include: bookingIncludes(),
    });

    return res.status(201).json({ booking });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/bookings/mine  – bookings as renter
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { renterId: req.userId },
      include: bookingIncludes(),
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/bookings/hosted  – bookings for spaces I own
router.get('/hosted', authMiddleware, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { space: { ownerId: req.userId } },
      include: bookingIncludes(),
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ bookings });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/bookings/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: bookingIncludes(),
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renterId !== req.userId && booking.space.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json({ booking });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/v1/bookings/:id/status  – confirm / cancel / complete
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'cancelled', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { space: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.space.ownerId === req.userId;
    const isRenter = booking.renterId === req.userId;

    if (status === 'confirmed' && !isOwner) return res.status(403).json({ error: 'Only the space owner can confirm' });
    if (status === 'completed' && !isOwner) return res.status(403).json({ error: 'Only the space owner can complete' });
    if (status === 'cancelled' && !isOwner && !isRenter) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: bookingIncludes(),
    });
    return res.json({ booking: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

function bookingIncludes() {
  return {
    space: {
      include: { owner: { select: { id: true, name: true } } },
    },
    renter: { select: { id: true, name: true, email: true } },
    review: true,
  };
}

module.exports = router;
