import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faqs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const faqs = db.prepare(`
    SELECT 
      f.id, f.category_id, f.question, f.aliases, f.answer, f.is_enabled, f.created_at, f.updated_at,
      c.name as category_name
    FROM faqs f
    LEFT JOIN faq_categories c ON f.category_id = c.id
    ORDER BY f.id DESC
  `).all();

  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faqs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { category_id, question, aliases, answer, is_enabled } = await req.json();
  if (!question) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  const finalAnswer = answer || '';
  const finalIsEnabled = finalAnswer.trim() === '' ? 0 : (is_enabled !== undefined ? (is_enabled ? 1 : 0) : 1);

  const db = getDb();

  const result = db.prepare(`
    INSERT INTO faqs (category_id, question, aliases, answer, is_enabled) 
    VALUES (?, ?, ?, ?, ?)
  `).run(
    category_id || null, 
    question, 
    aliases || null, 
    finalAnswer, 
    finalIsEnabled
  );

  log('info', `FAQ created: ${question}`, { createdBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ id: result.lastInsertRowid, category_id, question, is_enabled }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faqs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, category_id, question, aliases, answer, is_enabled } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
  }

  const db = getDb();

  const faq = db.prepare('SELECT category_id, question, aliases, answer, is_enabled FROM faqs WHERE id = ?').get(id) as any;
  if (!faq) {
    return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
  }

  const finalCategoryId = category_id !== undefined ? (category_id || null) : faq.category_id;
  const finalQuestion = question || faq.question;
  const finalAliases = aliases !== undefined ? aliases : faq.aliases;
  const finalAnswer = answer !== undefined ? answer : faq.answer;
  let finalIsEnabled = is_enabled !== undefined ? (is_enabled ? 1 : 0) : faq.is_enabled;

  if (finalAnswer.trim() === '') {
    finalIsEnabled = 0;
  }

  db.prepare(`
    UPDATE faqs 
    SET 
      category_id = ?,
      question = ?,
      aliases = ?,
      answer = ?,
      is_enabled = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    finalCategoryId,
    finalQuestion,
    finalAliases,
    finalAnswer,
    finalIsEnabled,
    id
  );

  log('info', `FAQ updated: ${finalQuestion}`, { updatedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faqs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'FAQ id is required' }, { status: 400 });
  }

  const db = getDb();
  const faq = db.prepare('SELECT question FROM faqs WHERE id = ?').get(id) as any;
  if (!faq) {
    return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
  log('info', `FAQ deleted: ${faq.question}`, { deletedBy: session?.user?.name || 'unknown' });

  return NextResponse.json({ ok: true });
}
