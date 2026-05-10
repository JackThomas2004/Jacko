const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { stripe, calculateFees } = require('../lib/stripe');
const {
  sendBookingRequestEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendBookingCompletedEmail,
} = require('../lib/email');

const router = express.Router();

// ─── POST /api/v1/bookings  — create a booking ────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { spaceId, startTime, endTime, notes } = req.body;
  if (!spaceId || !startTime || !endTime) {
    return res.status(400).json({ error: 'spaceId, startTime, and endTime are required' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return res.status(400).json({ error: 'Invalid time range' });
  }
  if (start < new Date()) {
    return res.status(400).json({ error: 'Start time must be in the future' });
  }

  try {
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!space || !space.isActive) {
      return res.status(404).json({ error: 'Space not found or unavailable' });
    }
    if (space.ownerId === req.userId) {
      return res.status(400).json({ error: 'You cannot book your own space' });
    }

    // Check for time conflicts (skip pending_payment — those may never complete)
    const conflict = await prisma.booking.findFirst({
      where: {
        spaceId,
        status: { in: ['pending', 'confirmed'] },
        AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
      },
    });
    if (conflict) {
      return res.status(409).json({ error: 'Space is already booked for that time period' });
    }

    // Calculate price
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    let subtotal;
    if (hours >= 20 && space.pricePerDay) {
      const days = Math.ceil(hours / 24);
      subtotal = days * space.pricePerDay;
    } else if (space.pricePerHour) {
      subtotal = Math.ceil(hours) * space.pricePerHour;
    } else {
      const days = Math.ceil(hours / 24);
      subtotal = days * space.pricePerDay;
    }

    const { serviceFee, total } = calculateFees(subtotal);

    // ── Stripe payment path ──────────────────────────────────────────────────
    if (stripe) {
      // Get or create Stripe customer
      const renter = await prisma.user.findUnique({ where: { id: req.userId } });
      let customerId = renter.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: renter.email,
          name: renter.name,
          metadata: { userId: renter.id },
        });
        customerId = customer.id;
        await prisma.user.update({
          where: { id: renter.id },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create PaymentIntent (amount in cents)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'usd',
        customer: customerId,
        metadata: {
          spaceId,
          renterId: req.userId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        },
        automatic_payment_methods: { enabled: true },
      });

      const booking = await prisma.booking.create({
        data: {
          id: uuidv4(),
          spaceId,
          renterId: req.userId,
          startTime: start,
          endTime: end,
          totalPrice: subtotal,
          serviceFee,
          status: 'pending_payment',
          paymentStatus: 'unpaid',
          stripePaymentIntentId: paymentIntent.id,
          notes: notes || null,
        },
        include: bookingIncludes(),
      });

      return res.status(201).json({ booking, clientSecret: paymentIntent.client_secret });
    }

    // ── No Stripe fallback ───────────────────────────────────────────────────
    const renter = await prisma.user.findUnique({ where: { id: req.userId } });

    const booking = await prisma.booking.create({
      data: {
        id: uuidv4(),
        spaceId,
        renterId: req.userId,
        startTime: start,
        endTime: end,
        totalPrice: subtotal,
        serviceFee,
        status: 'pending',
        paymentStatus: 'paid', // treat as paid in no-stripe mode
        notes: notes || null,
      },
      include: bookingIncludes(),
    });

    // Notify host
    sendBookingRequestEmail(space.owner, booking, space, renter).catch((err) =>
      console.error('[bookings] Failed to send booking request email:', err.message)
    );

    return res.status(201).json({ booking, clientSecret: null });
  } catch (err) {
    console.error('[bookings POST /]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/v1/bookings/mine  — bookings as renter ─────────────────────────
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { renterId: req.userId },
      include: bookingIncludes(),
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ bookings });
  } catch (err) {
    console.error('[bookings GET /mine]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/v1/bookings/hosted  — bookings for spaces I own ────────────────
router.get('/hosted', authMiddleware, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { space: { ownerId: req.userId } },
      include: bookingIncludes(),
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ bookings });
  } catch (err) {
    console.error('[bookings GET /hosted]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/v1/bookings/:id ─────────────────────────────────────────────────
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
    console.error('[bookings GET /:id]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── PATCH /api/v1/bookings/:id/status  — confirm / cancel / complete ─────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'cancelled', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        space: {
          include: { owner: { select: { id: true, name: true, email: true } } },
        },
        renter: { select: { id: true, name: true, email: true } },
      },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.space.ownerId === req.userId;
    const isRenter = booking.renterId === req.userId;

    if (status === 'confirmed' && !isOwner) {
      return res.status(403).json({ error: 'Only the space owner can confirm a booking' });
    }
    if (status === 'completed' && !isOwner) {
      return res.status(403).json({ error: 'Only the space owner can mark a booking as completed' });
    }
    if (status === 'cancelled' && !isOwner && !isRenter) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: bookingIncludes(),
    });

    // Send status emails (non-blocking)
    const space = booking.space;
    const renter = booking.renter;
    const host = booking.space.owner;

    if (status === 'confirmed') {
      sendBookingConfirmedEmail(renter, updated, space).catch((err) =>
        console.error('[bookings] Failed to send confirmed email:', err.message)
      );
    } else if (status === 'cancelled') {
      // Notify the other party
      const recipient = isOwner ? renter : host;
      sendBookingCancelledEmail(recipient, updated, space).catch((err) =>
        console.error('[bookings] Failed to send cancelled email:', err.message)
      );
    } else if (status === 'completed') {
      sendBookingCompletedEmail(renter, updated, space).catch((err) =>
        console.error('[bookings] Failed to send completed email:', err.message)
      );
    }

    return res.json({ booking: updated });
  } catch (err) {
    console.error('[bookings PATCH /:id/status]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bookingIncludes() {
  return {
    space: {
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    },
    renter: { select: { id: true, name: true, email: true } },
    review: true,
  };
}

module.exports = router;
