import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/crypto';
import { log } from '@/lib/logger';

export async function GET() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/config')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const rows = db.prepare('SELECT key, value_encrypted, updated_at FROM config').all() as {
    key: string;
    value_encrypted: string;
    updated_at: string;
  }[];

  const config: Record<string, { value: string; updated_at: string }> = {};
  for (const row of rows) {
    let value: string;
    try {
      value = decrypt(row.value_encrypted);
    } catch {
      value = '[decryption error]';
    }
    // Mask API keys
    if (row.key.includes('api_key') && value.length > 8) {
      value = value.substring(0, 4) + '...' + value.substring(value.length - 4);
    }
    config[row.key] = { value, updated_at: row.updated_at };
  }

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/config')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
  }

  const db = getDb();
  const encrypted = encrypt(String(value));
  db.prepare(
    `INSERT INTO config (key, value_encrypted, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value_encrypted = excluded.value_encrypted, updated_at = datetime('now')`
  ).run(key, encrypted);

  log('info', `Config updated: ${key}`, { updatedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}
