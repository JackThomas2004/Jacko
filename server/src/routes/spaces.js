const express = require('express');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { geocodeAddress } = require('../lib/geocode');

const router = express.Router();

const VALID_TYPES = ['garage', 'driveway', 'parking_lot', 'carport'];

// ─── Haversine distance (km) ──────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/v1/spaces  — public search
// Supports: city, state, type, minPrice, maxPrice, priceUnit, lat, lng, radius (km)
router.get('/', async (req, res) => {
  const { city, state, type, minPrice, maxPrice, priceUnit = 'hour', lat, lng, radius } = req.query;

  const where = { isActive: true };
  if (city) where.city = { contains: city };
  if (state) where.state = state;
  if (type && VALID_TYPES.includes(type)) where.type = type;
  if (minPrice || maxPrice) {
    const field = priceUnit === 'day' ? 'pricePerDay' : 'pricePerHour';
    where[field] = {};
    if (minPrice) where[field].gte = parseFloat(minPrice);
    if (maxPrice) where[field].lte = parseFloat(maxPrice);
  }

  try {
    let spaces = await prisma.space.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Proximity filter (haversine in JS, SQLite has no spatial functions)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 10; // default 10 km

      if (!isNaN(userLat) && !isNaN(userLng)) {
        spaces = spaces.filter((s) => {
          if (s.latitude == null || s.longitude == null) return false;
          const dist = haversineKm(userLat, userLng, s.latitude, s.longitude);
          return dist <= radiusKm;
        });
      }
    }

    return res.json({ spaces: spaces.map(formatSpace) });
  } catch (err) {
    console.error('[spaces GET /]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/spaces/owner/mine  — must be defined BEFORE /:id to avoid conflict
router.get('/owner/mine', authMiddleware, async (req, res) => {
  try {
    const spaces = await prisma.space.findMany({
      where: { ownerId: req.userId },
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        availability: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ spaces: spaces.map(formatSpace) });
  } catch (err) {
    console.error('[spaces GET /owner/mine]', err);
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
        availability: { orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { bookings: true } },
      },
    });
    if (!space) return res.status(404).json({ error: 'Space not found' });
    return res.json({ space: formatSpace(space) });
  } catch (err) {
    console.error('[spaces GET /:id]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/spaces  — create listing (auth required)
router.post('/', authMiddleware, async (req, res) => {
  const {
    title, description, address, city, state, zipCode,
    type, pricePerHour, pricePerDay, amenities, images,
    instantBook, maxVehicleSize,
  } = req.body;

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
    // Geocode address
    const { latitude, longitude } = await geocodeAddress(address, city, state, zipCode);

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
        latitude,
        longitude,
        type,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : null,
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        amenities: JSON.stringify(amenities || []),
        images: JSON.stringify(images || []),
        instantBook: Boolean(instantBook),
        maxVehicleSize: maxVehicleSize || null,
      },
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        availability: true,
        _count: { select: { bookings: true } },
      },
    });
    return res.status(201).json({ space: formatSpace(space) });
  } catch (err) {
    console.error('[spaces POST /]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/v1/spaces/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const space = await prisma.space.findUnique({ where: { id: req.params.id } });
    if (!space) return res.status(404).json({ error: 'Space not found' });
    if (space.ownerId !== req.userId) return res.status(403).json({ error: 'Forbidden' });

    const {
      title, description, address, city, state, zipCode,
      type, pricePerHour, pricePerDay, amenities, images,
      isActive, instantBook, maxVehicleSize,
    } = req.body;

    // Regeocode if address components changed
    let geoUpdate = {};
    const addressChanged = address !== undefined || city !== undefined || state !== undefined || zipCode !== undefined;
    if (addressChanged) {
      const newAddress = address ?? space.address;
      const newCity = city ?? space.city;
      const newState = state ?? space.state;
      const newZipCode = zipCode ?? space.zipCode;
      const { latitude, longitude } = await geocodeAddress(newAddress, newCity, newState, newZipCode);
      geoUpdate = { latitude, longitude };
    }

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
        ...(instantBook !== undefined && { instantBook: Boolean(instantBook) }),
        ...(maxVehicleSize !== undefined && { maxVehicleSize }),
        ...geoUpdate,
      },
      include: {
        owner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        availability: true,
        _count: { select: { bookings: true } },
      },
    });
    return res.json({ space: formatSpace(updated) });
  } catch (err) {
    console.error('[spaces PATCH /:id]', err);
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
    console.error('[spaces DELETE /:id]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSpace(space) {
  const ratings = space.reviews?.map((r) => r.rating) || [];
  const avgRating = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;
  return {
    ...space,
    amenities: parseJSON(space.amenities, []),
    images: parseJSON(space.images, []),
    avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    reviewCount: ratings.length,
  };
}

function parseJSON(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

module.exports = router;
