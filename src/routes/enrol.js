const { Router } = require('express');
const QRCode = require('qrcode');
const { generateSecret, generateKeyUri } = require('../lib/totp');
const { encrypt } = require('../lib/crypto');
const { getDb } = require('../lib/db');

const router = Router();

router.post('/enrol', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const db = getDb();
  const existing = db.prepare('SELECT status FROM users WHERE user_id = ?').get(user_id);
  if (existing && existing.status === 'ACTIVE') {
    return res.status(409).json({ error: 'user already enrolled' });
  }

  const secret = generateSecret();
  const keyUri = generateKeyUri(user_id, secret);
  const { encrypted, iv, authTag } = encrypt(secret);

  const stmt = db.prepare(`
    INSERT INTO users (user_id, secret_encrypted, iv, auth_tag, status)
    VALUES (?, ?, ?, ?, 'PENDING')
    ON CONFLICT(user_id) DO UPDATE SET
      secret_encrypted = excluded.secret_encrypted,
      iv = excluded.iv,
      auth_tag = excluded.auth_tag,
      status = 'PENDING',
      created_at = unixepoch()
  `);
  stmt.run(user_id, encrypted, iv, authTag);

  db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'ENROL', 'OK', ?)")
    .run(user_id, req.ip);

  const qrDataUrl = await QRCode.toDataURL(keyUri, { width: 300, margin: 2 });

  res.json({ user_id, qr: qrDataUrl, uri: keyUri });
});

module.exports = router;
