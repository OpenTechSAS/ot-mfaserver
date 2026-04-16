const { Router } = require('express');
const { getDb } = require('../lib/db');
const { getRedis } = require('../lib/redis');

const router = Router();

router.get('/health', async (_req, res) => {
  const checks = { db: false, redis: false };

  try {
    getDb().prepare('SELECT 1').get();
    checks.db = true;
  } catch {}

  try {
    const pong = await getRedis().ping();
    checks.redis = pong === 'PONG';
  } catch {}

  const healthy = checks.db && checks.redis;
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});

module.exports = router;
