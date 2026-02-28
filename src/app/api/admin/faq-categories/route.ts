import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faq-categories')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const categories = db.prepare(
    'SELECT id, name, slug, created_at FROM faq_categories ORDER BY name'
  ).all();

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faq-categories')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, slug } = await req.json();
  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM faq_categories WHERE name = ? OR slug = ?').get(name, slug);
  if (existing) {
    return NextResponse.json({ error: 'Category name or slug already exists' }, { status: 409 });
  }

  const result = db.prepare(
    'INSERT INTO faq_categories (name, slug) VALUES (?, ?)'
  ).run(name, slug);

  log('info', `FAQ Category created: ${name}`, { createdBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ id: result.lastInsertRowid, name, slug }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faq-categories')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, name, slug } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
  }

  const db = getDb();

  const cat = db.prepare('SELECT id, name FROM faq_categories WHERE id = ?').get(id) as any;
  if (!cat) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  if (name || slug) {
    const dup = db.prepare('SELECT id FROM faq_categories WHERE (name = ? OR slug = ?) AND id != ?').get(name, slug, id);
    if (dup) {
      return NextResponse.json({ error: 'Name or slug already in use' }, { status: 409 });
    }
  }

  if (name) {
    db.prepare('UPDATE faq_categories SET name = ? WHERE id = ?').run(name, id);
  }
  if (slug) {
    db.prepare('UPDATE faq_categories SET slug = ? WHERE id = ?').run(slug, id);
  }

  log('info', `FAQ Category updated: ${name || cat.name}`, { updatedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faq-categories')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
  }

  const db = getDb();
  const cat = db.prepare('SELECT name FROM faq_categories WHERE id = ?').get(id) as any;
  if (!cat) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM faq_categories WHERE id = ?').run(id);
  log('info', `FAQ Category deleted: ${cat.name}`, { deletedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}
