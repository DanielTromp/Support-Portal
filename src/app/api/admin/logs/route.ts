import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/logs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const level = url.searchParams.get('level');
  const offset = (page - 1) * limit;

  const db = getDb();

  let whereClause = '';
  const params: (string | number)[] = [];
  if (level) {
    whereClause = 'WHERE level = ?';
    params.push(level);
  }

  const totalRow = db.prepare(
    `SELECT COUNT(*) as count FROM system_logs ${whereClause}`
  ).get(...params) as { count: number };

  const logs = db.prepare(`
    SELECT id, level, message, details_json, created_at
    FROM system_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return NextResponse.json({ logs, total: totalRow.count, page, limit });
}
