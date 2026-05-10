const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const VALID_TYPES = ['garage', 'driveway', 'parking_lot', 'carport'];

// GET /api/v1/spaces  – public search
router.get('/', async (req, res) => {
  const { city, state, type, minPrice, maxPrice, priceUnit = 'hour' } = req.query;

  const where = { isActive: true };
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (state) where.state = state;
  if (type && VALID_TYPES.includes(type)) where.type = type;
  if (minPrice || maxPrice) {
    const field = priceUnit === 'day' ? 'pricePerDay' : 'pricePerHour';
    where[field] = {};
    if (minPrice) where[field].gte = parseFloat(minPrice);
    if (maxPrice) where[field].lte = parseFloat(maxPrice);
  }

  try {
    const spaces = await prisma.space.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ spaces: spaces.map(formatSpace) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/spaces/:id
router.get('/:id', async (req, res) => {
  try {
    const space = await prisma.space.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, bio: true, createdAt: true } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { bookings: true } },
      },
    });
    if (!space) return res.status(404).json({ error: 'Space not found' });
    return res.json({ space: formatSpace(space) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/spaces  – create listing (auth required)
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, address, city, state, zipCode, type, pricePerHour, pricePerDay, amenities, images } = req.body;

  if (!title || !address || !city || !state || !zipCode || !type) {
    return res.status(400).json({ error: 'title, address, city, state, zipCode, type are required' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (!pricePerHour && !pricePerDay) {
    return res.status(400).json({ error: 'At least one of pricePerHour or pricePerDay is required' });
  }

  try {
    const space = await prisma.space.create({
      data: {
        id: uuidv4(),
        ownerId: req.userId,
        title,
        description: description || null,
        address,
        city,
        state,
        zipCode,
        type,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : null,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        amenities: JSON.stringify(amenities || []),
        images: JSON.stringify(images || []),
      },
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
    });
    return res.status(201).json({ space: formatSpace(space) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/v1/spaces/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const space = await prisma.space.findUnique({ where: { id: req.params.id } });
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, address, city, state, zipCode, type, pricePerHour, pricePerDay, amenities, images, isActive } = req.body;
    const updated = await prisma.space.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zipCode !== undefined && { zipCode }),
        ...(type !== undefined && { type }),
        ...(pricePerHour !== undefined && { pricePerHour: pricePerHour ? parseFloat(pricePerHour) : null }),
        ...(pricePerDay !== undefined && { pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null }),
        ...(amenities !== undefined && { amenities: JSON.stringify(amenities) }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
    });
    return res.json({ space: formatSpace(updated) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/spaces/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const space = await prisma.space.findUnique({ where: { id: req.params.id } });
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.space.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Space deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/spaces/owner/mine
router.get('/owner/mine', authMiddleware, async (req, res) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { ownerId: req.userId },
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ spaces: spaces.map(formatSpace) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

function formatSpace(space) {
  const ratings = space.reviews?.map((r) => r.rating) || [];
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  return {
    ...space,
    amenities: parseJSON(space.amenities, []),
    images: parseJSON(space.images, []),
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount: ratings.length,
  };
}

function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

module.exports = router;
