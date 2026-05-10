let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * Calculate service fee and total.
 * @param {number} subtotal - Base price before fees
 * @returns {{ subtotal: number, serviceFee: number, total: number }}
 */
function calculateFees(subtotal) {
  const serviceFee = Math.round(subtotal * 0.10 * 100) / 100;
  const total = Math.round((subtotal + serviceFee) * 100) / 100;
  return { subtotal, serviceFee, total };
}

module.exports = { stripe, calculateFees };
