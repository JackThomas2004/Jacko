const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendRoutes = require('./routes/friends');
const lobbyRoutes = require('./routes/lobbies');
const gameRoutes = require('./routes/games');

const app = express();

// CLIENT_ORIGIN can be a comma-separated list of allowed origins, e.g.:
// "https://jacko.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/friends', friendRoutes);
app.use('/api/v1/lobbies', lobbyRoutes);
app.use('/api/v1/games', gameRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
