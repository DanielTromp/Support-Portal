import { getDb } from './db';
import { decrypt } from './crypto';

interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  cost: number;
}

function getApiKey(): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value_encrypted FROM config WHERE key = ?').get('openrouter_api_key') as
    | { value_encrypted: string }
    | undefined;
  if (!row) return null;
  try {
    return decrypt(row.value_encrypted);
  } catch {
    return null;
  }
}

export async function generateEmbedding(text: string, timeoutMs = 5000): Promise<EmbeddingResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-embedding-001',
        input: text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) return null;

    const data = await res.json();
    const embedding = data?.data?.[0]?.embedding;
    if (!embedding) return null;

    const usage = data?.usage || {};
    return {
      embedding,
      tokens: usage.total_tokens || usage.prompt_tokens || 0,
      cost: typeof usage.cost === 'number' ? usage.cost : 0,
    };
  } catch {
    return null;
  }
}

function logEmbeddingUsage(tokens: number, cost: number, type: 'generation' | 'query'): void {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO embedding_usage (tokens, cost, type) VALUES (?, ?, ?)'
    ).run(tokens, cost, type);
  } catch {
    // Table may not exist yet
  }
}

export function storeEmbedding(faqId: number, vector: number[], tokens = 0, cost = 0): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO faq_embeddings (faq_id, embedding_json, cost, tokens, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(faqId, JSON.stringify(vector), cost, tokens);
}

export function getEmbedding(faqId: number): number[] | null {
  const db = getDb();
  const row = db.prepare('SELECT embedding_json FROM faq_embeddings WHERE faq_id = ?').get(faqId) as
    | { embedding_json: string }
    | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.embedding_json);
  } catch {
    return null;
  }
}

export function getAllEmbeddings(): { faqId: number; embedding: number[] }[] {
  const db = getDb();
  const rows = db.prepare('SELECT faq_id, embedding_json FROM faq_embeddings').all() as
    { faq_id: number; embedding_json: string }[];

  const results: { faqId: number; embedding: number[] }[] = [];
  for (const row of rows) {
    try {
      results.push({ faqId: row.faq_id, embedding: JSON.parse(row.embedding_json) });
    } catch {
      // skip corrupt rows
    }
  }
  return results;
}

export function deleteEmbedding(faqId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM faq_embeddings WHERE faq_id = ?').run(faqId);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function generateAndStoreEmbedding(faqId: number): Promise<void> {
  const db = getDb();
  const row = db.prepare(`
    SELECT question, aliases, answer FROM faqs WHERE id = ?
  `).get(faqId) as { question: string; aliases: string | null; answer: string } | undefined;

  if (!row) return;

  const text = [row.question, row.aliases || '', row.answer].join(' ');
  const result = await generateEmbedding(text, 15000);
  if (result) {
    storeEmbedding(faqId, result.embedding, result.tokens, result.cost);
    logEmbeddingUsage(result.tokens, result.cost, 'generation');
  }
}

export async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  const result = await generateEmbedding(text);
  if (result) {
    logEmbeddingUsage(result.tokens, result.cost, 'query');
    return result.embedding;
  }
  return null;
}

export async function regenerateAllEmbeddings(): Promise<void> {
  const db = getDb();
  const rows = db.prepare('SELECT id FROM faqs WHERE is_enabled = 1').all() as { id: number }[];

  for (const row of rows) {
    await generateAndStoreEmbedding(row.id);
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
