import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'support-portal.db');

function fixSchema() {
  const db = new Database(DB_PATH);
  
  db.exec('PRAGMA writable_schema = 1;');
  
  db.exec(`
    UPDATE sqlite_master
    SET sql = REPLACE(sql, '"users_old"', 'users')
    WHERE sql LIKE '%"users_old"%';
  `);
  
  db.exec(`
    UPDATE sqlite_master
    SET sql = REPLACE(sql, 'users_old', 'users')
    WHERE sql LIKE '%users_old%';
  `);

  db.exec('PRAGMA writable_schema = 0;');
  
  // Force sqlite to reload schema
  db.exec('VACUUM;');

  console.log('Schema fixed!');
}

fixSchema();
