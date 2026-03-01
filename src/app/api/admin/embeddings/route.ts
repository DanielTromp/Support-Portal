import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/rbac';
import { getDb } from '@/lib/db';
import { regenerateAllEmbeddings } from '@/lib/embeddings';

export async function GET() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faqs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getDb();
  const totalEnabled = (db.prepare('SELECT count(*) as c FROM faqs WHERE is_enabled = 1').get() as any).c;
  const totalDisabled = (db.prepare('SELECT count(*) as c FROM faqs WHERE is_enabled = 0').get() as any).c;
  const embedded = (db.prepare('SELECT count(*) as c FROM faq_embeddings').get() as any).c;

  const lastUpdated = (db.prepare(
    'SELECT max(updated_at) as t FROM faq_embeddings'
  ).get() as any)?.t || null;

  const model = (db.prepare(
    'SELECT model FROM faq_embeddings LIMIT 1'
  ).get() as { model: string } | undefined)?.model || null;

  // FAQs missing embeddings
  const missing = db.prepare(`
    SELECT f.id, f.question FROM faqs f
    LEFT JOIN faq_embeddings e ON f.id = e.faq_id
    WHERE f.is_enabled = 1 AND e.faq_id IS NULL
    ORDER BY f.id
  `).all() as { id: number; question: string }[];

  // Stale embeddings (FAQ updated after embedding was generated)
  const stale = db.prepare(`
    SELECT f.id, f.question FROM faqs f
    JOIN faq_embeddings e ON f.id = e.faq_id
    WHERE f.updated_at > e.updated_at
    ORDER BY f.id
  `).all() as { id: number; question: string }[];

  // Orphaned embeddings (embedding exists but FAQ disabled or deleted)
  const orphaned = (db.prepare(`
    SELECT count(*) as c FROM faq_embeddings e
    LEFT JOIN faqs f ON e.faq_id = f.id
    WHERE f.id IS NULL OR f.is_enabled = 0
  `).get() as any).c;

  // FTS5 row count
  let ftsCount = 0;
  try {
    ftsCount = (db.prepare('SELECT count(*) as c FROM faqs_fts').get() as any).c;
  } catch {
    // FTS5 table may not exist
  }

  // Cost tracking
  const embeddingStorageCost = (db.prepare(
    'SELECT COALESCE(SUM(cost), 0) as total_cost, COALESCE(SUM(tokens), 0) as total_tokens FROM faq_embeddings'
  ).get() as any);

  let queryCost = { total_cost: 0, total_tokens: 0, count: 0 };
  let generationCost = { total_cost: 0, total_tokens: 0, count: 0 };
  try {
    queryCost = db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total_cost, COALESCE(SUM(tokens), 0) as total_tokens, count(*) as count
      FROM embedding_usage WHERE type = 'query'
    `).get() as any;
    generationCost = db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total_cost, COALESCE(SUM(tokens), 0) as total_tokens, count(*) as count
      FROM embedding_usage WHERE type = 'generation'
    `).get() as any;
  } catch {
    // Table may not exist pre-migration
  }

  return NextResponse.json({
    totalEnabled,
    totalDisabled,
    embedded,
    missing,
    stale,
    orphaned,
    ftsCount,
    model,
    lastUpdated,
    costs: {
      generation: {
        cost: generationCost.total_cost,
        tokens: generationCost.total_tokens,
        count: generationCost.count,
      },
      query: {
        cost: queryCost.total_cost,
        tokens: queryCost.total_tokens,
        count: queryCost.count,
      },
      totalCost: generationCost.total_cost + queryCost.total_cost,
      totalTokens: generationCost.total_tokens + queryCost.total_tokens,
    },
  });
}

export async function POST() {
  const session = await auth();
  if (!await checkAccess(session?.user?.role, '/admin/faqs')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  regenerateAllEmbeddings().catch(() => {});

  return NextResponse.json({ ok: true, message: 'Embedding regeneration started in background' });
}
