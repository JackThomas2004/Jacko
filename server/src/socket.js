const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { registerHandlers } = require('./game/socketHandlers');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split(';')
        .find((c) => c.trim().startsWith('token='))
        ?.split('=')[1];

    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);
    registerHandlers(io, socket);
  });

  return io;
}

module.exports = { initSocket };
