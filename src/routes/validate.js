const { Router } = require('express');
const { verify } = require('../lib/totp');
const { decrypt } = require('../lib/crypto');
const { getDb } = require('../lib/db');
const { isReplay, checkRateLimit, resetRateLimit } = require('../lib/redis');

const router = Router();

router.post('/validate', async (req, res) => {
  const { user_id, token } = req.body;
  if (!user_id || !token) return res.status(400).json({ error: 'user_id and token required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id);

  if (!user || user.status !== 'ACTIVE') {
    return res.status(404).json({ valid: false, error: 'user not enrolled' });
  }

  const limited = await checkRateLimit(user_id);
  if (limited) {
    db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'VALIDATE', 'RATE_LIMITED', ?)")
      .run(user_id, req.ip);
    return res.status(429).json({ valid: false, error: 'too many attempts, wait 15 min' });
  }

  const replay = await isReplay(user_id, token);
  if (replay) {
    db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'VALIDATE', 'REPLAY', ?)")
      .run(user_id, req.ip);
    return res.status(401).json({ valid: false, error: 'token already used' });
  }

  const secret = decrypt(user.secret_encrypted, user.iv, user.auth_tag);
  const valid = verify(token, secret);

  if (!valid) {
    db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'VALIDATE', 'FAIL', ?)")
      .run(user_id, req.ip);
    return res.status(401).json({ valid: false });
  }

  await resetRateLimit(user_id);
  db.prepare('UPDATE users SET last_used_at = unixepoch() WHERE user_id = ?').run(user_id);
  db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'VALIDATE', 'OK', ?)")
    .run(user_id, req.ip);

  res.json({ valid: true, user_id });
});

module.exports = router;
