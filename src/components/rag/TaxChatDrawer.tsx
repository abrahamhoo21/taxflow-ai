'use client';

import React, { useState } from 'react';
import { RAGQueryResponse } from '@/types/rag';

export function TaxChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; responseData?: RAGQueryResponse }>>([
    {
      role: 'assistant',
      text: 'Hello Abraham! I am your YYC Tax AI Assistant. You can ask me any question about Malaysian e-Invoicing (LHDN v3.0), Service Tax (SST 8%), Sales Tax (LVG), or Withholding Tax.',
    },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userText }),
      });
      const data: RAGQueryResponse = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          responseData: data,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an issue connecting to the tax RAG backend. Please check your Gemini API key and database setup.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl shadow-blue-500/25 border border-blue-400/30 transition transform hover:scale-105"
      >
        <span>🤖</span>
        <span>Ask Tax AI (RAG)</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#0c1220] border-l border-slate-800 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-base">🤖</span>
            <div>
              <div className="font-bold text-xs text-slate-100">YYC Tax RAG Intelligence</div>
              <div className="text-[10px] text-emerald-400">Grounded on 5 Official LHDN/Customs PDFs</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-[#0f172a] border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Citation Badges & Verification Status */}
                {m.responseData?.citations && m.responseData.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                      <span>📌</span> Verified Citations ({m.responseData.citations.length}):
                    </div>
                    {m.responseData.citations.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono space-y-0.5"
                      >
                        <div>
                          Doc: <span className="text-slate-100">{c.doc_name}</span>
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
                  <div className="mt-2 p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Question outside ingested documents. Guardrail activated.</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>Searching vector database &amp; validating citations...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-blue-500 rounded-xl px-3 py-2 transition">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask about LHDN e-invoice deadline, SST 8%, LVG..."
              className="w-full bg-transparent border-0 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 transition"
            >
              Ask
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
