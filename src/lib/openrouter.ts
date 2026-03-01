import { getDb } from './db';
import { decrypt } from './crypto';
import { searchFaq } from './search';

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

async function buildSystemPrompt(userQuery: string, customPrompt: string | null, conversationContext?: string): Promise<string> {
  const matches = await searchFaq(userQuery, 8, conversationContext);

  let prompt = `You are a helpful support assistant. Answer questions using the FAQ knowledge base provided below.
Use the FAQ entries to formulate helpful answers, even if the user's exact question doesn't match a FAQ title — look at aliases and answers for relevant information.
If no FAQ entry is even remotely related to the user's question, politely say you don't have that information and suggest contacting support.
Always be friendly and professional. Answer in the same language as the user's question.`;

  if (matches.length > 0) {
    prompt += '\n\n## Relevant FAQ\n';
    for (const item of matches) {
      prompt += `\n### ${item.question}\n`;
      if (item.aliases) {
        prompt += `Also known as: ${item.aliases}\n`;
      }
      prompt += `${item.answer}\n`;
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

  // Search FAQs using the latest user message (primary) + recent context (for vector search)
  const userMessages = messages.filter(m => m.role === 'user');
  const latestMessage = userMessages[userMessages.length - 1]?.content || '';
  const context = userMessages.length > 1
    ? userMessages.slice(-5, -1).map(m => m.content).join(' ')
    : undefined;
  const systemPrompt = await buildSystemPrompt(latestMessage, customPrompt, context);

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

  // OpenRouter returns cost inside usage object
  const cost = typeof usage.cost === 'number' ? usage.cost : 0;

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
