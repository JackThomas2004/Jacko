let resend = null;

if (process.env.RESEND_API_KEY) {
  const { Resend } = require('resend');
  resend = new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM || 'ParkSpot <noreply@parkspot.com>';
const CLIENT = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

/**
 * Send an email via Resend, or log to console if no API key is set.
 */
async function sendEmail({ to, subject, html }) {
  if (resend) {
    try {
      const result = await resend.emails.send({ from: FROM, to, subject, html });
      return result;
    } catch (err) {
      console.error('[email] Resend error:', err.message);
    }
  } else {
    console.log('\n=== [EMAIL LOG — no RESEND_API_KEY set] ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    console.log('===========================================\n');
  }
}

function baseLayout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ParkSpot</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#f4f4f5;margin:0;padding:0;}
  .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}
  .header{background:#1d4ed8;padding:28px 32px;}
  .header h1{color:#fff;margin:0;font-size:24px;letter-spacing:-.5px;}
  .header span{color:#93c5fd;font-size:14px;}
  .body{padding:32px;}
  .body p{color:#374151;line-height:1.6;margin:0 0 16px;}
  .btn{display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;}
  .detail-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;}
  .detail-row{display:flex;justify-content:space-between;padding:4px 0;color:#374151;font-size:14px;}
  .detail-row span:first-child{color:#6b7280;}
  .footer{padding:20px 32px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;text-align:center;}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>ParkSpot</h1>
    <span>Your parking marketplace</span>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} ParkSpot &bull; <a href="${CLIENT}" style="color:#6b7280;">Visit ParkSpot</a>
  </div>
</div>
</body>
</html>`;
}

function formatDate(dt) {
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}

function formatPrice(n) {
  return typeof n === 'number' ? `$${n.toFixed(2)}` : String(n);
}

// ─── Email functions ───────────────────────────────────────────────────────────

async function sendVerificationEmail(user, token) {
  const link = `${CLIENT}/verify-email?token=${token}`;
  const html = baseLayout(`
    <p>Hi ${user.name},</p>
    <p>Thanks for joining ParkSpot! Please verify your email address to activate your account.</p>
    <p><a class="btn" href="${link}">Verify Email Address</a></p>
    <p style="font-size:13px;color:#6b7280;">This link expires in 24 hours. If you didn't create a ParkSpot account, you can ignore this email.</p>
  `);
  return sendEmail({ to: user.email, subject: 'Verify your ParkSpot email', html });
}

async function sendPasswordResetEmail(user, token) {
  const link = `${CLIENT}/reset-password?token=${token}`;
  const html = baseLayout(`
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your ParkSpot password. Click the button below to choose a new password.</p>
    <p><a class="btn" href="${link}">Reset Password</a></p>
    <p style="font-size:13px;color:#6b7280;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `);
  return sendEmail({ to: user.email, subject: 'Reset your ParkSpot password', html });
}

async function sendBookingRequestEmail(host, booking, space, renter) {
  const link = `${CLIENT}/bookings/${booking.id}`;
  const html = baseLayout(`
    <p>Hi ${host.name},</p>
    <p>You have a new booking request for <strong>${space.title}</strong>!</p>
    <div class="detail-box">
      <div class="detail-row"><span>Renter</span><span>${renter.name}</span></div>
      <div class="detail-row"><span>Check-in</span><span>${formatDate(booking.startTime)}</span></div>
      <div class="detail-row"><span>Check-out</span><span>${formatDate(booking.endTime)}</span></div>
      <div class="detail-row"><span>Total</span><span>${formatPrice(booking.totalPrice)}</span></div>
      ${booking.notes ? `<div class="detail-row"><span>Notes</span><span>${booking.notes}</span></div>` : ''}
    </div>
    <p>Please review and confirm or decline this request.</p>
    <p><a class="btn" href="${link}">View Booking</a></p>
  `);
  return sendEmail({ to: host.email, subject: `New booking request for ${space.title}`, html });
}

async function sendBookingConfirmedEmail(renter, booking, space) {
  const link = `${CLIENT}/bookings/${booking.id}`;
  const html = baseLayout(`
    <p>Hi ${renter.name},</p>
    <p>Great news! Your booking for <strong>${space.title}</strong> has been confirmed.</p>
    <div class="detail-box">
      <div class="detail-row"><span>Space</span><span>${space.title}</span></div>
      <div class="detail-row"><span>Address</span><span>${space.address}, ${space.city}, ${space.state}</span></div>
      <div class="detail-row"><span>Check-in</span><span>${formatDate(booking.startTime)}</span></div>
      <div class="detail-row"><span>Check-out</span><span>${formatDate(booking.endTime)}</span></div>
      <div class="detail-row"><span>Total paid</span><span>${formatPrice(booking.totalPrice)}</span></div>
    </div>
    <p><a class="btn" href="${link}">View Booking Details</a></p>
  `);
  return sendEmail({ to: renter.email, subject: `Booking confirmed — ${space.title}`, html });
}

async function sendBookingCancelledEmail(recipient, booking, space) {
  const link = `${CLIENT}/bookings/${booking.id}`;
  const html = baseLayout(`
    <p>Hi ${recipient.name},</p>
    <p>The booking for <strong>${space.title}</strong> has been cancelled.</p>
    <div class="detail-box">
      <div class="detail-row"><span>Space</span><span>${space.title}</span></div>
      <div class="detail-row"><span>Check-in</span><span>${formatDate(booking.startTime)}</span></div>
      <div class="detail-row"><span>Check-out</span><span>${formatDate(booking.endTime)}</span></div>
    </div>
    <p>If you have any questions, please contact us.</p>
    <p><a class="btn" href="${link}">View Booking</a></p>
  `);
  return sendEmail({ to: recipient.email, subject: `Booking cancelled — ${space.title}`, html });
}

async function sendBookingCompletedEmail(renter, booking, space) {
  const reviewLink = `${CLIENT}/bookings/${booking.id}?review=1`;
  const html = baseLayout(`
    <p>Hi ${renter.name},</p>
    <p>Your parking session at <strong>${space.title}</strong> is now complete. We hope it went well!</p>
    <div class="detail-box">
      <div class="detail-row"><span>Space</span><span>${space.title}</span></div>
      <div class="detail-row"><span>Check-in</span><span>${formatDate(booking.startTime)}</span></div>
      <div class="detail-row"><span>Check-out</span><span>${formatDate(booking.endTime)}</span></div>
    </div>
    <p>Help other drivers by leaving a review!</p>
    <p><a class="btn" href="${reviewLink}">Leave a Review</a></p>
  `);
  return sendEmail({ to: renter.email, subject: `How was your parking at ${space.title}?`, html });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingRequestEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendBookingCompletedEmail,
};
