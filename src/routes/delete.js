const { Router } = require('express');
const { getDb } = require('../lib/db');

const router = Router();

router.post('/delete', (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const db = getDb();
  const user = db.prepare('SELECT status FROM users WHERE user_id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'user not found' });

  db.prepare("UPDATE users SET status = 'DISABLED' WHERE user_id = ?").run(user_id);
  db.prepare("INSERT INTO audit (user_id, action, result, ip) VALUES (?, 'DELETE', 'OK', ?)")
    .run(user_id, req.ip);

  res.json({ user_id, status: 'DISABLED' });
});

module.exports = router;
