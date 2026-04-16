const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/mfa.db');

let _db;

function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      secret_encrypted BLOB NOT NULL,
      iv BLOB NOT NULL,
      auth_tag BLOB NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      recovery_codes TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      activated_at INTEGER,
      last_used_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      result TEXT NOT NULL,
      ip TEXT,
      ts INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit(ts);
  `);

  return _db;
}

module.exports = { getDb };
