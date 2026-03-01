import { getDb } from './db';
import Fuse from 'fuse.js';
import { FaqItem } from '@/types';
import { generateQueryEmbedding, getAllEmbeddings, cosineSimilarity } from './embeddings';

// --- Fuse.js cache ---

let fuseInstance: Fuse<FaqItem> | null = null;
let fuseGeneration = 0;
let fuseBuildGeneration = -1;

export function invalidateFaqCache(): void {
  fuseGeneration++;
}

function getFaqsFromDb(): FaqItem[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT f.id, f.question, f.answer, f.aliases, c.name as category
    FROM faqs f
    LEFT JOIN faq_categories c ON f.category_id = c.id
    WHERE f.is_enabled = 1
  `).all() as any[];

  return rows.map(r => ({
    id: String(r.id),
    question: r.question,
    answer: r.answer,
    category: r.category || 'Uncategorized',
    aliases: r.aliases || undefined,
  }));
}

function getFuse(): Fuse<FaqItem> {
  if (!fuseInstance || fuseBuildGeneration !== fuseGeneration) {
    const items = getFaqsFromDb();
    fuseInstance = new Fuse(items, {
      keys: [
        { name: 'question', weight: 0.6 },
        { name: 'answer', weight: 0.3 },
        { name: 'category', weight: 0.1 },
        { name: 'aliases', weight: 0.5 },
      ],
      threshold: 0.7,
      includeScore: true,
    });
    fuseBuildGeneration = fuseGeneration;
  }
  return fuseInstance;
}

function searchFuse(query: string, limit: number): { id: string; score: number; item: FaqItem }[] {
  const fuse = getFuse();
  return fuse.search(query, { limit }).map(r => ({
    id: r.item.id,
    score: 1 - (r.score ?? 1), // Fuse score: 0=perfect, 1=worst → invert
    item: r.item,
  }));
}

// --- FTS5 search ---

function formatFtsQuery(query: string): string {
  // Strip punctuation but preserve letters (including Dutch diacritics) and numbers
  const tokens = query
    .replace(/[.,;:!?'"()\[\]{}<>\/\\@#$%^&*_+=|~`—–-]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 1);
  if (tokens.length === 0) return '';
  return tokens.map(t => `"${t}"*`).join(' OR ');
}

function searchFts5(query: string, limit: number): { id: string; score: number; item: FaqItem }[] {
  try {
    const ftsQuery = formatFtsQuery(query);
    if (!ftsQuery) return [];

    const db = getDb();
    const rows = db.prepare(`
      SELECT f.id, f.question, f.answer, f.aliases, c.name as category,
             bm25(faqs_fts) as rank
      FROM faqs_fts fts
      JOIN faqs f ON f.id = fts.rowid
      LEFT JOIN faq_categories c ON f.category_id = c.id
      WHERE faqs_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(ftsQuery, limit) as any[];

    if (rows.length === 0) return [];

    // BM25 returns negative scores (more negative = better match)
    const maxAbs = Math.max(...rows.map(r => Math.abs(r.rank)), 1);
    return rows.map(r => ({
      id: String(r.id),
      score: Math.abs(r.rank) / maxAbs, // Normalize to 0-1
      item: {
        id: String(r.id),
        question: r.question,
        answer: r.answer,
        category: r.category || 'Uncategorized',
        aliases: r.aliases || undefined,
      },
    }));
  } catch {
    // FTS5 table may not exist yet (pre-migration)
    return [];
  }
}

// --- Vector search ---

// Cache parsed embeddings in memory (invalidated alongside Fuse cache)
let embeddingCache: { faqId: number; embedding: number[] }[] | null = null;
let embeddingCacheGeneration = -1;

function getCachedEmbeddings(): { faqId: number; embedding: number[] }[] {
  if (!embeddingCache || embeddingCacheGeneration !== fuseGeneration) {
    embeddingCache = getAllEmbeddings();
    embeddingCacheGeneration = fuseGeneration;
  }
  return embeddingCache;
}

async function searchVector(query: string, limit: number): Promise<{ id: string; score: number; item: FaqItem }[]> {
  try {
    const stored = getCachedEmbeddings();
    if (stored.length === 0) return [];

    const queryEmbedding = await generateQueryEmbedding(query);
    if (!queryEmbedding) return [];

    const scored = stored
      .map(s => ({ faqId: s.faqId, score: cosineSimilarity(queryEmbedding, s.embedding) }))
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (scored.length === 0) return [];

    // Fetch full FAQ data for matched IDs
    const db = getDb();
    const results: { id: string; score: number; item: FaqItem }[] = [];
    for (const s of scored) {
      const row = db.prepare(`
        SELECT f.id, f.question, f.answer, f.aliases, c.name as category
        FROM faqs f
        LEFT JOIN faq_categories c ON f.category_id = c.id
        WHERE f.id = ?
      `).get(s.faqId) as any;
      if (row) {
        results.push({
          id: String(row.id),
          score: s.score,
          item: {
            id: String(row.id),
            question: row.question,
            answer: row.answer,
            category: row.category || 'Uncategorized',
            aliases: row.aliases || undefined,
          },
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

// --- Combined search ---

export async function searchFaq(query: string, limit = 8, conversationContext?: string): Promise<FaqItem[]> {
  if (!query.trim()) return [];

  // Fuse.js and FTS5 search on the current message only (keyword-based)
  // Vector search uses current message + conversation context (semantic)
  const vectorQuery = conversationContext
    ? `${query} ${conversationContext}`
    : query;

  const [fuseResults, ftsResults, vectorResults] = await Promise.all([
    Promise.resolve(searchFuse(query, limit)),
    Promise.resolve(searchFts5(query, limit)),
    searchVector(vectorQuery, limit),
  ]);

  // Merge and deduplicate
  const merged = new Map<string, { score: number; layerCount: number; item: FaqItem }>();

  for (const results of [fuseResults, ftsResults, vectorResults]) {
    for (const r of results) {
      const existing = merged.get(r.id);
      if (existing) {
        existing.score = Math.max(existing.score, r.score);
        existing.layerCount++;
      } else {
        merged.set(r.id, { score: r.score, layerCount: 1, item: r.item });
      }
    }
  }

  // Items found by multiple layers get a boost
  return Array.from(merged.values())
    .map(m => ({
      ...m,
      finalScore: m.score + (m.layerCount > 1 ? 0.3 : 0),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit)
    .map(m => m.item);
}
