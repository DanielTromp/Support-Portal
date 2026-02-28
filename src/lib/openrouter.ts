import { getDb } from './db';
import { decrypt } from './crypto';
import Fuse from 'fuse.js';
import fs from 'fs';
import path from 'path';
import { FaqItem, FaqData } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  cost: number;
}

function getConfig(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value_encrypted FROM config WHERE key = ?').get(key) as
    | { value_encrypted: string }
    | undefined;
  if (!row) return null;
  try {
    return decrypt(row.value_encrypted);
  } catch {
    return null;
  }
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
    aliases: r.aliases,
  }));
}

function searchFaq(query: string, limit = 8): FaqItem[] {
  const items = getFaqsFromDb();
  if (!items.length) return [];

  const fuse = new Fuse(items, {
    keys: [
      { name: 'question', weight: 0.6 },
      { name: 'answer', weight: 0.3 },
      { name: 'category', weight: 0.1 },
      { name: 'aliases', weight: 0.5 },
    ],
    threshold: 0.5,
    includeScore: true,
  });

  return fuse.search(query, { limit }).map((r) => r.item);
}

function buildSystemPrompt(userQuery: string, customPrompt: string | null): string {
  const matches = searchFaq(userQuery);

  let prompt = `You are a helpful support assistant. Answer questions based on the FAQ knowledge base provided below.
If a question is not covered in the FAQ context, politely say you don't have that information and suggest contacting support.
Always be friendly and professional. Answer in the same language as the user's question.`;

  if (matches.length > 0) {
    prompt += '\n\n## Relevant FAQ\n';
    for (const item of matches) {
      prompt += `\n### ${item.question}\n${item.answer}\n`;
    }
  }

  if (customPrompt) {
    prompt += `\n\n## Additional Instructions\n${customPrompt}`;
  }

  return prompt;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<OpenRouterResponse> {
  const apiKey = getConfig('openrouter_api_key');
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Set it in Admin > Chat Config.');
  }

  const model = getConfig('openrouter_model') || 'google/gemini-2.5-flash';
  const customPrompt = getConfig('openrouter_system_prompt');
  const maxTokens = parseInt(getConfig('openrouter_max_tokens') || '2048', 10);

  // Extract the latest user message for FAQ search
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const systemPrompt = buildSystemPrompt(lastUserMessage?.content || '', customPrompt);

  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'Support Portal',
    },
    body: JSON.stringify({
      model,
      messages: fullMessages,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // OpenRouter includes cost in the response header or we estimate
  const cost = parseFloat(res.headers.get('x-cost') || '0');

  return {
    content: choice?.message?.content || '',
    usage: {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
    },
    model: data.model || model,
    cost,
  };
}
