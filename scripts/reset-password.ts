import { getDb } from '../src/lib/db';
import { hashSync } from 'bcryptjs';

const db = getDb();
const hash = hashSync('admin', 10);
db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, 'admin');
console.log('Admin password has been reset to "admin"');
