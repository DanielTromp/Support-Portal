import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { chatCompletion } from '@/lib/openrouter';
import { logActivity, log } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, sessionId: existingSessionId, language } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const db = getDb();
    const userId = parseInt(session.user.id);

    // Create or resume session
    let sessionId = existingSessionId;
    if (!sessionId) {
      sessionId = randomUUID();
      const title = message.substring(0, 100);
      db.prepare(
        'INSERT INTO chat_sessions (id, user_id, title, language) VALUES (?, ?, ?, ?)'
      ).run(sessionId, userId, title, language || 'nl');
    }

    // Store user message
    db.prepare(
      'INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)'
    ).run(sessionId, 'user', message);

    // Load conversation history
    const history = db
      .prepare('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at')
      .all(sessionId) as { role: 'user' | 'assistant' | 'system'; content: string }[];

    // Call OpenRouter
    const result = await chatCompletion(history);

    // Store assistant response
    db.prepare(
      'INSERT INTO chat_messages (session_id, role, content, tokens_in, tokens_out, cost, model) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      sessionId,
      'assistant',
      result.content,
      result.usage.prompt_tokens,
      result.usage.completion_tokens,
      result.cost,
      result.model
    );

    logActivity('chat_message', {
      userId,
      sessionId,
      details: { tokens: result.usage.total_tokens, model: result.model },
    });

    return NextResponse.json({
      content: result.content,
      sessionId,
      usage: result.usage,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Chat API error', { error: errMsg });

    // Return user-friendly error for missing API key
    if (errMsg.includes('not configured')) {
      return NextResponse.json({ error: errMsg }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
