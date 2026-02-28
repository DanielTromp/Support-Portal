import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'support-portal.db');

function migrateRoles() {
  const db = new Database(DB_PATH);
  
  // Turn off foreign keys to safely recreate referenced table
  db.exec('PRAGMA foreign_keys = OFF;');

  db.transaction(() => {
    // 1. Create roles table
    db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        permissions_json TEXT DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // 2. Insert default roles
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name, description, permissions_json) VALUES (?, ?, ?)');
    insertRole.run('admin', 'Super administrator with full access', JSON.stringify(['*']));
    insertRole.run('user', 'Standard user with no admin access', JSON.stringify([]));
    insertRole.run('trainer', 'Trainer with access to FAQs and Chat History', JSON.stringify([
      '/admin/chat-history',
      '/admin/faqs',
      '/admin/faq-categories'
    ]));

    // 3. Migrate users table to remove CHECK constraint on role
    // Check if the users table has the CHECK constraint by checking sql
    const userTableQuery = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as { sql: string };
    if (userTableQuery.sql.includes('CHECK')) {
      console.log('Migrating users table to remove CHECK constraint...');
      
      // Rename old table
      db.exec('ALTER TABLE users RENAME TO users_old;');
      
      // Create new table without CHECK
      db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      
      // Copy data
      db.exec('INSERT INTO users SELECT id, username, password_hash, role, created_at FROM users_old;');
      
      // Drop old
      db.exec('DROP TABLE users_old;');
      console.log('Users table migrated.');
    } else {
      console.log('Users table already migrated.');
    }
  })();

  // Turn foreign keys back on
  db.exec('PRAGMA foreign_keys = ON;');
  console.log('Roles migration complete!');
}

migrateRoles();
