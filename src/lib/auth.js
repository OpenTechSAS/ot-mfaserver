const crypto = require('crypto');

function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  const expected = process.env.API_KEY;
  if (!key || !expected) return res.status(401).json({ error: 'missing api key' });

  const keyBuf = Buffer.from(key, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (keyBuf.length !== expectedBuf.length) return res.status(401).json({ error: 'invalid api key' });
  const valid = crypto.timingSafeEqual(keyBuf, expectedBuf);
  if (!valid) return res.status(401).json({ error: 'invalid api key' });
  next();
}

module.exports = { apiKeyAuth };
