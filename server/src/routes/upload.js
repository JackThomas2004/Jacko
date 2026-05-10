const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../lib/cloudinary');
const authMiddleware = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Multer: memory storage, 10 MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Upload a buffer to Cloudinary via upload_stream.
 * Returns a Promise<{ url, publicId }>.
 */
function uploadToCloudinary(buffer, folder = 'parkspot/spaces') {
  return new Promise((resolve, reject) => {
    const publicId = `${folder}/${uuidv4()}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

// ─── POST /api/v1/upload  — upload a single image ─────────────────────────────
router.post(
  '/',
  authMiddleware,
  uploadLimiter,
  (req, res, next) => {
    // Verify Cloudinary is configured before accepting the upload
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(503).json({
        error: 'Image uploads are not configured on this server. Please set Cloudinary environment variables.',
      });
    }
    next();
  },
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Send an image in the "file" field.' });
    }

    try {
      const { url, publicId } = await uploadToCloudinary(req.file.buffer);
      return res.status(201).json({ url, publicId });
    } catch (err) {
      console.error('[upload] Cloudinary error:', err);
      return res.status(500).json({ error: 'Failed to upload image. Please try again.' });
    }
  }
);

// ─── Multer error handler ─────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Upload error' });
});

module.exports = router;
