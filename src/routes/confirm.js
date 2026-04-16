const { Router } = require('express');
const { verify } = require('../lib/totp');
const { decrypt } = require('../lib/crypto');
const { getDb } = require('../lib/db');

const router = Router();

router.post('/confirm', (req, res) => {
  const { user_id, token } = req.body;
  if (!user_id || !token) return res.status(400).json({ error: 'user_id and token required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (user.status === 'ACTIVE') return res.status(409).json({ error: 'already confirmed' });

  const secret = decrypt(user.secret_encrypted, user.iv, user.auth_tag);
  const valid = verify(token, secret);

  if (!valid) {
    db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'CONFIRM', 'FAIL', ?)")
      .run(user_id, req.ip);
    return res.status(401).json({ error: 'invalid token' });
  }

  db.prepare("UPDATE users SET status = 'ACTIVE', activated_at = unixepoch() WHERE user_id = ?")
    .run(user_id);
  db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'CONFIRM', 'OK', ?)")
    .run(user_id, req.ip);

  res.json({ user_id, status: 'ACTIVE' });
});

module.exports = router;
