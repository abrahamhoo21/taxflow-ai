'use client';

import React, { useState } from 'react';
import { RAGQueryResponse } from '@/types/rag';
import {
  Bot,
  FileCheck2,
  AlertTriangle,
  X,
  Send,
  ShieldCheck,
  Loader2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { TAX_CHAT_CONFIG } from '@/constants/tax';

export function TaxChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; responseData?: RAGQueryResponse }>
  >([
    {
      role: 'assistant',
      text: TAX_CHAT_CONFIG.WELCOME_MESSAGE,
    },
  ]);

  const executeQuestion = async (text: string) => {
    if (!text.trim() || loading) return;

    const userText = text.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned error status ${res.status}`);
      }

      const data: RAGQueryResponse = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          responseData: data,
        },
      ]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Query error: ${errorMsg}. Please click the sample question again to retry.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeQuestion(query);
  };

  const handleReset = () => {
    setMessages([{ role: 'assistant', text: TAX_CHAT_CONFIG.WELCOME_MESSAGE }]);
    setQuery('');
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-xl shadow-blue-500/25 border border-blue-400/30 transition transform hover:scale-105"
      >
        <Bot className="w-4 h-4 text-blue-100" />
        <span>Ask Tax AI (RAG)</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#0c1220] border-l border-slate-800 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{TAX_CHAT_CONFIG.TITLE}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium">
                  {TAX_CHAT_CONFIG.BADGE}
                </span>
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{TAX_CHAT_CONFIG.SUBTITLE}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleReset}
              title="Reset conversation"
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl p-4 space-y-2.5 leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>

                {/* Citation Badges & Verification Status */}
                {m.responseData?.citations && m.responseData.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Verified Citations ({m.responseData.citations.length}):</span>
                    </div>
                    {m.responseData.citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono space-y-1"
                      >
                        <div>
                          Doc: <span className="text-slate-100 font-medium">{c.doc_name}</span>
                        </div>
                        <div className="text-amber-400 font-medium">
                          Page {c.page_number} {c.section_title ? `• ${c.section_title}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hallucination Guard Notification */}
                {m.responseData?.hallucination_warning && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Question outside ingested documents. Guardrail activated.</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Suggested Questions Guidance (Prompt Starters) */}
          {messages.length === 1 && (
            <div className="pt-2 pb-1 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 px-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Suggested Questions (Click to Ask):</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {TAX_CHAT_CONFIG.SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => executeQuestion(q.question)}
                    disabled={loading}
                    className="text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 hover:border-blue-500/50 transition group flex items-start gap-2.5 shadow-sm"
                  >
                    <span className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                      {q.badge}
                    </span>
                    <span className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                      {q.question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-400 flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Searching vector database &amp; validating citations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-blue-500 rounded-xl px-3.5 py-2.5 transition">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={TAX_CHAT_CONFIG.INPUT_PLACEHOLDER}
              className="w-full bg-transparent border-0 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 flex-shrink-0 transition"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
