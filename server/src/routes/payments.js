const express = require('express');
const prisma = require('../lib/prisma');
const { stripe } = require('../lib/stripe');
const {
  sendBookingRequestEmail,
  sendBookingConfirmedEmail,
} = require('../lib/email');

const router = express.Router();

// ─── GET /api/v1/payments/config  — return Stripe publishable key ─────────────
router.get('/config', (req, res) => {
  return res.json({
    publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || null,
  });
});

// ─── POST /api/v1/payments/webhook  — Stripe webhook ─────────────────────────
// NOTE: This route requires raw (unparsed) body — handled in app.js with express.raw()
router.post('/webhook', async (req, res) => {
  if (!stripe) {
    console.warn('[payments/webhook] Stripe not configured, skipping webhook');
    return res.json({ received: true });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[payments/webhook] STRIPE_WEBHOOK_SECRET not set');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[payments/webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    try {
      const booking = await prisma.booking.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: {
          space: {
            include: { owner: { select: { id: true, name: true, email: true } } },
          },
          renter: { select: { id: true, name: true, email: true } },
        },
      });

      if (!booking) {
        console.warn('[payments/webhook] No booking found for PaymentIntent:', paymentIntent.id);
        return res.json({ received: true });
      }

      // Determine new status
      const newStatus = booking.space.instantBook ? 'confirmed' : 'pending';

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'paid',
          status: newStatus,
        },
        include: {
          space: {
            include: { owner: { select: { id: true, name: true, email: true } } },
          },
          renter: { select: { id: true, name: true, email: true } },
        },
      });

      const space = updated.space;
      const renter = updated.renter;
      const host = updated.space.owner;

      if (newStatus === 'confirmed') {
        // Instant book: notify renter their booking is confirmed
        sendBookingConfirmedEmail(renter, updated, space).catch((err) =>
          console.error('[payments/webhook] Failed to send confirmed email:', err.message)
        );
      } else {
        // Standard: notify host of new booking request
        sendBookingRequestEmail(host, updated, space, renter).catch((err) =>
          console.error('[payments/webhook] Failed to send booking request email:', err.message)
        );
      }

      console.log(`[payments/webhook] Booking ${booking.id} updated: paymentStatus=paid, status=${newStatus}`);
    } catch (err) {
      console.error('[payments/webhook] Error processing payment_intent.succeeded:', err);
      // Return 500 so Stripe will retry
      return res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  return res.json({ received: true });
});

module.exports = router;
