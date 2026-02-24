import { getDb } from './db';
import { decrypt } from './crypto';

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

export async function chatCompletion(messages: ChatMessage[]): Promise<OpenRouterResponse> {
  const apiKey = getConfig('openrouter_api_key');
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured. Set it in Admin > Chat Config.');
  }

  const model = getConfig('openrouter_model') || 'google/gemini-2.5-flash';
  const systemPrompt = getConfig('openrouter_system_prompt');
  const maxTokens = parseInt(getConfig('openrouter_max_tokens') || '2048', 10);

  const fullMessages: ChatMessage[] = [];
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }
  fullMessages.push(...messages);

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
