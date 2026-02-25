'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Bot, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language } from '@/types';
import { t } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

interface ChatPanelProps {
  language: Language;
}

export default function ChatPanel({ language }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setError(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: data.content,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t(language, 'chat_error');
      setError(errMsg);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, sessionId, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Panel + attached tab */}
      <div
        className={`fixed top-[65px] right-0 bottom-0 w-full sm:w-[540px] z-[60] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Side tab — always visible, toggles panel */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="absolute right-full top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 px-2 py-4 rounded-l-xl bg-brand-purple text-white shadow-lg shadow-black/20 border-l-2 border-t-2 border-b-2 border-white/30 hover:px-3 hover:shadow-xl transition-all duration-200"
          aria-label={t(language, 'chat_tab')}
        >
          <MessageCircle size={20} />
          <span className="chat-tab-text text-xs font-semibold tracking-wide">
            {t(language, 'chat_tab')}
          </span>
        </button>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-navy to-brand-purple text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">
                {t(language, 'chat_title')}
              </h3>
              <span className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {t(language, 'chat_status_online')}
              </span>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={t(language, 'chat_new')}
            title={t(language, 'chat_new')}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto chat-scrollbar p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && !isTyping && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-brand-purple" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-gray-700 shadow-sm border border-gray-100 max-w-[85%]">
                {t(language, 'chat_welcome')}
              </div>
            </div>
          )}

          {messages.map((msg) =>
            msg.role === 'bot' ? (
              <div key={msg.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-brand-purple" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-gray-700 shadow-sm border border-gray-100 max-w-[85%] prose prose-sm prose-gray prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-code:text-brand-purple prose-code:before:content-none prose-code:after:content-none prose-a:text-brand-purple">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-end">
                <div className="bg-brand-purple text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm max-w-[85%]">
                  {msg.text}
                </div>
              </div>
            )
          )}

          {isTyping && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-brand-purple" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 p-3 bg-white">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'chat_placeholder')}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50 placeholder:text-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-purple text-white flex items-center justify-center hover:bg-brand-purple/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label={t(language, 'chat_send')}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            {t(language, 'chat_disclaimer')}
          </p>
        </div>
      </div>
    </>
  );
}
