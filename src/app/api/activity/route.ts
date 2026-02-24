import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

    const { action, details } = await req.json();
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    logActivity(action, { userId, details });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
