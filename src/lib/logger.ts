import { getDb } from './db';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(level: LogLevel, message: string, details?: Record<string, unknown>) {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO system_logs (level, message, details_json) VALUES (?, ?, ?)'
    ).run(level, message, details ? JSON.stringify(details) : null);
  } catch (e) {
    console.error('[logger] Failed to write system log:', e);
  }
}

export function logActivity(
  action: string,
  opts?: { userId?: number; sessionId?: string; details?: Record<string, unknown> }
) {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO activity_log (user_id, session_id, action, details_json) VALUES (?, ?, ?, ?)'
    ).run(
      opts?.userId ?? null,
      opts?.sessionId ?? null,
      action,
      opts?.details ? JSON.stringify(opts.details) : null
    );
  } catch (e) {
    console.error('[logger] Failed to write activity log:', e);
  }
}
