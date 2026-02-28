import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/usage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();

  // Totals
  const totals = db.prepare(`
    SELECT
      COUNT(DISTINCT session_id) as total_sessions,
      COALESCE(SUM(tokens_in), 0) as total_tokens_in,
      COALESCE(SUM(tokens_out), 0) as total_tokens_out,
      COALESCE(SUM(cost), 0) as total_cost,
      COUNT(*) as total_messages
    FROM chat_messages
    WHERE role = 'assistant'
  `).get();

  // By user
  const byUser = db.prepare(`
    SELECT
      u.username,
      COUNT(DISTINCT cm.session_id) as sessions,
      COALESCE(SUM(cm.tokens_in), 0) as tokens_in,
      COALESCE(SUM(cm.tokens_out), 0) as tokens_out,
      COALESCE(SUM(cm.cost), 0) as cost
    FROM chat_messages cm
    JOIN chat_sessions cs ON cm.session_id = cs.id
    JOIN users u ON cs.user_id = u.id
    WHERE cm.role = 'assistant'
    GROUP BY u.id
    ORDER BY cost DESC
  `).all();

  // By day (last 30 days)
  const byDay = db.prepare(`
    SELECT
      DATE(cm.created_at) as day,
      COALESCE(SUM(cm.tokens_in), 0) as tokens_in,
      COALESCE(SUM(cm.tokens_out), 0) as tokens_out,
      COALESCE(SUM(cm.cost), 0) as cost,
      COUNT(*) as messages
    FROM chat_messages cm
    WHERE cm.role = 'assistant' AND cm.created_at >= datetime('now', '-30 days')
    GROUP BY DATE(cm.created_at)
    ORDER BY day DESC
  `).all();

  return NextResponse.json({ totals, byUser, byDay });
}
