const Redis = require('ioredis');

let _redis;

function getRedis() {
  if (_redis) return _redis;
  _redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  _redis.connect().catch(() => {});
  return _redis;
}

async function isReplay(userId, token) {
  const key = `mfa:used:${userId}:${token}`;
  const set = await getRedis().set(key, '1', 'EX', 60, 'NX');
  return set === null;
}

async function checkRateLimit(userId, maxAttempts = 5, windowSec = 900) {
  const key = `mfa:rl:${userId}`;
  const r = getRedis();
  const current = await r.incr(key);
  if (current === 1) await r.expire(key, windowSec);
  return current > maxAttempts;
}

async function resetRateLimit(userId) {
  await getRedis().del(`mfa:rl:${userId}`);
}

module.exports = { getRedis, isReplay, checkRateLimit, resetRateLimit };
