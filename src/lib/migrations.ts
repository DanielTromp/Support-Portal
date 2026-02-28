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
        db.exec('PRAGMA foreign_keys = OFF;');

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

        db.exec('PRAGMA foreign_keys = ON;');
      }
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

  console.log(`[migrate] All migrations complete. Schema version: ${getCurrentVersion(db)}`);
}

export { getCurrentVersion, ensureVersionTable, migrations };
