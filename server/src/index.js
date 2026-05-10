require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 4000;

const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
  console.log(`ParkSpot server running on http://localhost:${PORT}`);
});
