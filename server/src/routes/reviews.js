const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/v1/reviews  – leave a review after a completed booking
router.post('/', authMiddleware, async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  if (!bookingId || !rating) return res.status(400).json({ error: 'bookingId and rating are required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1–5' });

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renterId !== req.userId) return res.status(403).json({ error: 'Only the renter can leave a review' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only review completed bookings' });
    if (booking.review) return res.status(409).json({ error: 'Review already submitted' });

    const review = await prisma.review.create({
      data: {
        id: uuidv4(),
        bookingId,
        spaceId: booking.spaceId,
        reviewerId: req.userId,
        rating: parseInt(rating),
        comment: comment || null,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
    });
    return res.status(201).json({ review });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/reviews/space/:spaceId
router.get('/space/:spaceId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { spaceId: req.params.spaceId },
      include: { reviewer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
