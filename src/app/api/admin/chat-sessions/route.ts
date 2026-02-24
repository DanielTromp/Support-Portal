import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const db = getDb();

  // If sessionId provided, return messages for that session
  const sessionId = url.searchParams.get('sessionId');
  if (sessionId) {
    const messages = db.prepare(
      'SELECT id, session_id, role, content, tokens_in, tokens_out, cost, model, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at'
    ).all(sessionId);
    return NextResponse.json({ messages });
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const total = (db.prepare('SELECT COUNT(*) as count FROM chat_sessions').get() as { count: number }).count;

  const sessions = db.prepare(`
    SELECT
      cs.id, cs.title, cs.started_at, cs.language,
      u.username,
      COUNT(cm.id) as message_count,
      COALESCE(SUM(cm.tokens_in), 0) as total_tokens_in,
      COALESCE(SUM(cm.tokens_out), 0) as total_tokens_out,
      COALESCE(SUM(cm.cost), 0) as total_cost
    FROM chat_sessions cs
    LEFT JOIN users u ON cs.user_id = u.id
    LEFT JOIN chat_messages cm ON cs.id = cm.session_id
    GROUP BY cs.id
    ORDER BY cs.started_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  return NextResponse.json({ sessions, total, page, limit });
}
