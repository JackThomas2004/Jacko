const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/email');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateToken();

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        passwordHash,
        phone: phone || null,
        emailVerified: false,
        verificationToken,
      },
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user, verificationToken).catch((err) =>
      console.error('[auth] Failed to send verification email:', err.message)
    );

    const token = signToken(user.id);
    setTokenCookie(res, token);
    return res.status(201).json({
      user: safeUser(user),
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('[auth/register]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const token = signToken(user.id);
    setTokenCookie(res, token);
    return res.json({ user: safeUser(user) });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out' });
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: safeUser(user) });
  } catch (err) {
    console.error('[auth/me]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/v1/auth/me
router.patch('/me', authMiddleware, async (req, res) => {
  const { name, phone, bio, avatar } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
    });
    return res.json({ user: safeUser(user) });
  } catch (err) {
    console.error('[auth/me PATCH]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  try {
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error('[auth/verify-email]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/resend-verification
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const verificationToken = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    await sendVerificationEmail(user, verificationToken);
    return res.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('[auth/resend-verification]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  // Always return 200 to prevent email enumeration
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = generateToken();
      // Store a hashed version in DB for security
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: tokenHash, resetTokenExpiry: expiry },
      });

      // Send the raw token (not the hash) in the email
      sendPasswordResetEmail(user, resetToken).catch((err) =>
        console.error('[auth] Failed to send reset email:', err.message)
      );
    }
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('[auth/forgot-password]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({ where: { resetToken: tokenHash } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    // Check expiry
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      // Clear expired token
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      });
      return res.status(400).json({ error: 'Password reset token has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
