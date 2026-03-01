import type Database from 'better-sqlite3';

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'add_faq_tables',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS faq_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS faqs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER REFERENCES faq_categories(id) ON DELETE SET NULL,
          question TEXT NOT NULL,
          aliases TEXT,
          answer TEXT NOT NULL,
          is_enabled INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    },
  },
  {
    version: 2,
    name: 'add_roles_and_rbac',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          permissions_json TEXT DEFAULT '[]',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      const insertRole = db.prepare(
        'INSERT OR IGNORE INTO roles (name, description, permissions_json) VALUES (?, ?, ?)'
      );
      insertRole.run('admin', 'Super administrator with full access', JSON.stringify(['*']));
      insertRole.run('user', 'Standard user with no admin access', JSON.stringify([]));
      insertRole.run('trainer', 'Trainer with access to FAQs and Chat History', JSON.stringify([
        '/admin/chat-history',
        '/admin/faqs',
        '/admin/faq-categories',
      ]));

      // Remove CHECK constraint from users.role if present
      const userTableInfo = db.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
      ).get() as { sql: string } | undefined;

      if (userTableInfo?.sql?.includes('CHECK')) {
        db.exec('ALTER TABLE users RENAME TO _users_migrate_v2;');
        db.exec(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          );
        `);
        db.exec(
          'INSERT INTO users SELECT id, username, password_hash, role, created_at FROM _users_migrate_v2;'
        );
        db.exec('DROP TABLE _users_migrate_v2;');
      }
    },
  },
  {
    version: 3,
    name: 'add_fts5_and_embeddings',
    up: (db) => {
      // FTS5 virtual table for full-text search
      db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS faqs_fts USING fts5(
          question, answer, aliases,
          tokenize='unicode61'
        );
      `);

      // Triggers to keep FTS5 in sync
      db.exec(`
        CREATE TRIGGER IF NOT EXISTS faqs_ai AFTER INSERT ON faqs BEGIN
          INSERT INTO faqs_fts(rowid, question, answer, aliases)
          VALUES (NEW.id, NEW.question, NEW.answer, COALESCE(NEW.aliases, ''));
        END;

        CREATE TRIGGER IF NOT EXISTS faqs_bu BEFORE UPDATE ON faqs BEGIN
          DELETE FROM faqs_fts WHERE rowid = OLD.id;
        END;

        CREATE TRIGGER IF NOT EXISTS faqs_au AFTER UPDATE ON faqs BEGIN
          INSERT INTO faqs_fts(rowid, question, answer, aliases)
          VALUES (NEW.id, NEW.question, NEW.answer, COALESCE(NEW.aliases, ''));
        END;

        CREATE TRIGGER IF NOT EXISTS faqs_bd BEFORE DELETE ON faqs BEGIN
          DELETE FROM faqs_fts WHERE rowid = OLD.id;
        END;
      `);

      // Populate FTS5 from existing enabled FAQs
      db.exec(`
        INSERT INTO faqs_fts(rowid, question, answer, aliases)
        SELECT id, question, answer, COALESCE(aliases, '') FROM faqs WHERE is_enabled = 1;
      `);

      // Embeddings storage table
      db.exec(`
        CREATE TABLE IF NOT EXISTS faq_embeddings (
          faq_id INTEGER PRIMARY KEY REFERENCES faqs(id) ON DELETE CASCADE,
          embedding_json TEXT NOT NULL,
          model TEXT NOT NULL DEFAULT 'google/gemini-embedding-001',
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    },
  },
  {
    version: 4,
    name: 'add_embedding_cost_tracking',
    up: (db) => {
      // Add cost column to faq_embeddings
      db.exec('ALTER TABLE faq_embeddings ADD COLUMN cost REAL NOT NULL DEFAULT 0');
      db.exec('ALTER TABLE faq_embeddings ADD COLUMN tokens INTEGER NOT NULL DEFAULT 0');

      // Table for tracking embedding query costs (per-search costs)
      db.exec(`
        CREATE TABLE IF NOT EXISTS embedding_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tokens INTEGER NOT NULL DEFAULT 0,
          cost REAL NOT NULL DEFAULT 0,
          type TEXT NOT NULL DEFAULT 'query',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    },
  },
];

function ensureVersionTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function getCurrentVersion(db: Database.Database): number {
  const row = db.prepare(
    'SELECT COALESCE(MAX(version), 0) as version FROM schema_version'
  ).get() as { version: number };
  return row.version;
}

export function runMigrations(db: Database.Database): void {
  ensureVersionTable(db);

  const current = getCurrentVersion(db);
  const pending = migrations.filter((m) => m.version > current);

  if (pending.length === 0) {
    return;
  }

  console.log(`[migrate] Current schema version: ${current}, applying ${pending.length} migration(s)...`);

  // Disable FK checks for migrations (PRAGMA cannot be set inside a transaction)
  db.pragma('foreign_keys = OFF');

  for (const migration of pending) {
    console.log(`[migrate] Applying v${migration.version}: ${migration.name}`);

    db.transaction(() => {
      migration.up(db);
      db.prepare(
        'INSERT INTO schema_version (version, name) VALUES (?, ?)'
      ).run(migration.version, migration.name);
    })();

    console.log(`[migrate] v${migration.version} applied.`);
  }

  db.pragma('foreign_keys = ON');

  console.log(`[migrate] All migrations complete. Schema version: ${getCurrentVersion(db)}`);
}

export { getCurrentVersion, ensureVersionTable, migrations };
