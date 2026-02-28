import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Reusing encryption helpers since config values are encrypted
const ALGORITHM = 'aes-256-gcm';
function getEnckey() {
  const encKeyHex = process.env.ENCRYPTION_KEY;
  if (!encKeyHex || encKeyHex.length !== 64) {
    throw new Error('Invalid ENCRYPTION_KEY');
  }
  return Buffer.from(encKeyHex, 'hex');
}

function decrypt(text: string): string {
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) return text;

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getEnckey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed', err);
    return '';
  }
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEnckey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/import-export')) {
    return new Response('Forbidden', { status: 403 });
  }

  const db = getDb();
  const rows = db.prepare('SELECT key, value_encrypted FROM config').all() as { key: string, value_encrypted: string }[];
  
  const configObj: Record<string, string> = {};
  for (const row of rows) {
    configObj[row.key] = decrypt(row.value_encrypted);
  }

  return new Response(JSON.stringify(configObj, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="config-export.json"'
    }
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/import-export')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await req.json();
  if (typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid config format, must be an object map.' }, { status: 400 });
  }

  const db = getDb();
  const insertStmt = db.prepare('INSERT OR REPLACE INTO config (key, value_encrypted, updated_at) VALUES (?, ?, datetime("now"))');
  
  db.transaction(() => {
     for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'string') {
           insertStmt.run(key, encrypt(val));
        }
     }
  })();

  return NextResponse.json({ ok: true, message: 'Config Import complete' });
}
