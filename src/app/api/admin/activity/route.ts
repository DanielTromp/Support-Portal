import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/activity')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const action = url.searchParams.get('action');
  const offset = (page - 1) * limit;

  const db = getDb();

  let whereClause = '';
  const params: (string | number)[] = [];
  if (action) {
    whereClause = 'WHERE al.action = ?';
    params.push(action);
  }

  const totalRow = db.prepare(
    `SELECT COUNT(*) as count FROM activity_log al ${whereClause}`
  ).get(...params) as { count: number };

  const activities = db.prepare(`
    SELECT al.id, al.action, al.details_json, al.created_at, al.session_id,
           u.username
    FROM activity_log al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return NextResponse.json({ activities, total: totalRow.count, page, limit });
}
