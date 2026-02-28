PRAGMA foreign_keys = OFF;

CREATE TABLE activity_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  session_id TEXT,
  action TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO activity_log_new SELECT * FROM activity_log;
DROP TABLE activity_log;
ALTER TABLE activity_log_new RENAME TO activity_log;

CREATE TABLE chat_sessions_new (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  language TEXT DEFAULT 'nl'
);
INSERT INTO chat_sessions_new SELECT * FROM chat_sessions;
DROP TABLE chat_sessions;
ALTER TABLE chat_sessions_new RENAME TO chat_sessions;

PRAGMA foreign_keys = ON;
