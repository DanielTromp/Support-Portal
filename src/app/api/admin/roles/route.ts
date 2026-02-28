import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkAccess } from '@/lib/rbac';
import { log } from '@/lib/logger';

export async function GET() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const roles = db.prepare(
    'SELECT id, name, description, permissions_json, created_at FROM roles ORDER BY id'
  ).all();

  return NextResponse.json({ roles });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, description, permissions_json } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM roles WHERE name = ?').get(name);
  if (existing) {
    return NextResponse.json({ error: 'Role already exists' }, { status: 409 });
  }

  const result = db.prepare(
    'INSERT INTO roles (name, description, permissions_json) VALUES (?, ?, ?)'
  ).run(name, description || '', permissions_json || '[]');

  log('info', `Role created: ${name}`, { createdBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ id: result.lastInsertRowid, name }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, name, description, permissions_json } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Role id is required' }, { status: 400 });
  }

  const db = getDb();
  const role = db.prepare('SELECT id, name FROM roles WHERE id = ?').get(id) as any;
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  if (name && name !== role.name) {
    const dup = db.prepare('SELECT id FROM roles WHERE name = ? AND id != ?').get(name, id);
    if (dup) {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 });
    }
  }

  if (name) db.prepare('UPDATE roles SET name = ? WHERE id = ?').run(name, id);
  if (description !== undefined) db.prepare('UPDATE roles SET description = ? WHERE id = ?').run(description, id);
  if (permissions_json !== undefined) db.prepare('UPDATE roles SET permissions_json = ? WHERE id = ?').run(permissions_json, id);

  log('info', `Role updated: ${name || role.name}`, { updatedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/users')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Role id is required' }, { status: 400 });
  }

  const db = getDb();
  const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(id) as any;
  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  if (['admin', 'user'].includes(role.name)) {
    return NextResponse.json({ error: 'Cannot delete core system roles' }, { status: 403 });
  }

  // Prevent deleting if assigned to users
  const assigned = db.prepare('SELECT count(*) as cnt FROM users WHERE role = ?').get(role.name) as {cnt: number};
  if (assigned.cnt > 0) {
    return NextResponse.json({ error: `Cannot delete role. Assigned to ${assigned.cnt} users.` }, { status: 409 });
  }

  db.prepare('DELETE FROM roles WHERE id = ?').run(id);
  log('info', `Role deleted: ${role.name}`, { deletedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}
