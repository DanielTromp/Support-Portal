import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations, getCurrentVersion, ensureVersionTable } from '../src/lib/migrations';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'support-portal.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

ensureVersionTable(db);
const before = getCurrentVersion(db);
console.log(`[migrate] Database: ${DB_PATH}`);
console.log(`[migrate] Schema version before: ${before}`);

runMigrations(db);

const after = getCurrentVersion(db);
if (after === before) {
  console.log(`[migrate] Already up to date (v${after}).`);
} else {
  console.log(`[migrate] Migrated from v${before} to v${after}.`);
}

db.close();
