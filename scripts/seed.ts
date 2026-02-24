import Database from 'better-sqlite3';
import { hashSync } from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'support-portal.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value_encrypted TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    language TEXT DEFAULT 'nl'
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES chat_sessions(id),
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    model TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    session_id TEXT,
    action TEXT NOT NULL,
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL DEFAULT 'info' CHECK(level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    details_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' },
];

const upsert = db.prepare(`
  INSERT INTO users (username, password_hash, role)
  VALUES (?, ?, ?)
  ON CONFLICT(username) DO UPDATE SET
    password_hash = excluded.password_hash,
    role = excluded.role
`);

for (const u of users) {
  const hash = hashSync(u.password, 10);
  upsert.run(u.username, hash, u.role);
  console.log(`Upserted user: ${u.username} (${u.role})`);
}

console.log('Seed complete. Database:', DB_PATH);
db.close();
