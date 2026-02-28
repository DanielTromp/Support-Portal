import { NextResponse } from 'next/server';
import { APP_VERSION, SCHEMA_VERSION } from '@/lib/version';
import { getDb } from '@/lib/db';
import { getCurrentVersion, ensureVersionTable } from '@/lib/migrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  ensureVersionTable(db);
  const dbVersion = getCurrentVersion(db);

  return NextResponse.json({
    app: APP_VERSION,
    schema: SCHEMA_VERSION,
    schemaApplied: dbVersion,
    upToDate: dbVersion >= SCHEMA_VERSION,
  });
}
