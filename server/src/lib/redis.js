const { createClient } = require('redis');

let client;

async function getRedis() {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    console.log('Redis connected');
  }
  return client;
}

async function getGameState(gameId) {
  const redis = await getRedis();
  const raw = await redis.get(`game:${gameId}`);
  return raw ? JSON.parse(raw) : null;
}

async function setGameState(gameId, state) {
  const redis = await getRedis();
  await redis.set(`game:${gameId}`, JSON.stringify(state), { EX: 86400 }); // 24h TTL
}

async function deleteGameState(gameId) {
  const redis = await getRedis();
  await redis.del(`game:${gameId}`);
}

module.exports = { getRedis, getGameState, setGameState, deleteGameState };
