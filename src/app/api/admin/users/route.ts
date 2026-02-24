import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { hashSync } from 'bcryptjs';
import { log } from '@/lib/logger';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const users = db.prepare(
    'SELECT id, username, role, created_at FROM users ORDER BY id'
  ).all();

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { username, password, role } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
  }
  if (role && !['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }

  const hash = hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
  ).run(username, hash, role || 'user');

  log('info', `User created: ${username}`, { createdBy: session.user.name });

  return NextResponse.json({ id: result.lastInsertRowid, username, role: role || 'user' }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, username, password, role } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }
  if (role && !['admin', 'user'].includes(role)) {
    return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 });
  }

  const db = getDb();

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id) as { id: number; username: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check username uniqueness if changing
  if (username && username !== user.username) {
    const dup = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
    if (dup) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
  }

  if (username) {
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, id);
  }
  if (role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  }
  if (password) {
    const hash = hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
  }

  log('info', `User updated: ${username || user.username}`, { updatedBy: session.user.name });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  // Prevent self-deletion
  if (String(id) === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id) as { username: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  log('info', `User deleted: ${user.username}`, { deletedBy: session.user.name });

  return NextResponse.json({ ok: true });
}
