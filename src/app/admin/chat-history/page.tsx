'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage } from '@/types';
import { ChevronDown, ChevronRight, ChevronLeft, User, Bot } from 'lucide-react';

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const limit = 15;

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/chat-sessions?page=${page}&limit=${limit}`);
    const data = await res.json();
    setSessions(data.sessions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  async function toggleSession(sessionId: string) {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);

    if (!messages[sessionId]) {
      const res = await fetch(`/api/admin/chat-sessions?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => ({ ...prev, [sessionId]: data.messages }));
      }
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chat History</h1>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            No chat sessions yet
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSession(s.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 truncate">{s.title || 'Untitled'}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {s.message_count} msgs
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{s.username}</span>
                    <span>{new Date(s.started_at + 'Z').toLocaleString()}</span>
                    {s.total_cost > 0 && <span>${s.total_cost.toFixed(4)}</span>}
                  </div>
                </div>
                {expandedSession === s.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
              </button>

              {expandedSession === s.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3 max-h-96 overflow-y-auto">
                  {messages[s.id] ? (
                    messages[s.id].map((m) => (
                      <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                        {m.role !== 'user' && (
                          <div className="w-6 h-6 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                            <Bot size={12} className="text-brand-purple" />
                          </div>
                        )}
                        <div className={`rounded-xl px-3 py-2 text-sm max-w-[80%] ${
                          m.role === 'user'
                            ? 'bg-brand-purple text-white'
                            : 'bg-white border border-gray-200 text-gray-700'
                        }`}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.role === 'assistant' && m.tokens_out > 0 && (
                            <p className="text-[10px] mt-1 opacity-60">
                              {m.tokens_in + m.tokens_out} tokens · {m.model}
                            </p>
                          )}
                        </div>
                        {m.role === 'user' && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm text-center">Loading messages...</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
