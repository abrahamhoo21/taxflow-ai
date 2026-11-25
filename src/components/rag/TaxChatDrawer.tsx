'use client';

import React, { useState } from 'react';
import { RAGQueryResponse } from '@/types/rag';
import {
  FileCheck2,
  AlertTriangle,
  X,
  Send,
  ShieldCheck,
  Loader2,
  RotateCcw,
  ExternalLink,
  FileText,
  Scale,
  HelpCircle,
} from 'lucide-react';
import { TAX_CHAT_CONFIG } from '@/constants/tax';

export function TaxChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<{ docName: string; pageNumber: number; url: string } | null>(null);
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
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111827] hover:bg-slate-800 text-slate-100 font-medium text-sm shadow-xl border border-slate-700/80 transition"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
          <Scale className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <span>Tax Intelligence</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
        className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#0e1424] border-l border-slate-800 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Scale className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{TAX_CHAT_CONFIG.TITLE}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  Statutory Tax RAG
                </span>
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Grounded on LHDN Statutory Guidelines &amp; Public Rulings</span>
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
                        className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-xs text-slate-300 space-y-2"
                      >
                        <div>
                          <div className="text-slate-200 font-mono text-[11px] font-medium truncate" title={c.doc_name}>
                            {c.doc_name}
                          </div>
                          <div className="text-amber-400 font-medium text-xs mt-0.5">
                            Page {c.page_number} {c.section_title ? `• ${c.section_title}` : ''}
                          </div>
                        </div>

                        {/* Interactive Online PDF & Official Portal Links */}
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-800/80">
                          {c.view_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewPdf({ docName: c.doc_name, pageNumber: c.page_number, url: c.view_url! })}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-[11px] font-medium transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span>Open PDF (Page {c.page_number})</span>
                            </button>
                          )}
                          {c.view_url && (
                            <a
                              href={c.view_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition"
                              title="Open raw PDF in new browser tab"
                            >
                              <span>Tab ↗</span>
                            </a>
                          )}
                          {c.official_url && (
                            <a
                              href={c.official_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-medium transition"
                            >
                              <span>Official LHDN Portal</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
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
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Reference Tax Inquiries (Click to Query):</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {TAX_CHAT_CONFIG.SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => executeQuestion(q.question)}
                    disabled={loading}
                    className="text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group flex items-start gap-2.5 shadow-sm"
                  >
                    <span className="mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
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

      {/* In-App PDF Page-Accurate Viewer Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-[90vh] bg-[#0c1220] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate" title={previewPdf.docName}>
                    {previewPdf.docName}
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    Auto-jumped to Page {previewPdf.pageNumber} via statutory citation
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={previewPdf.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition"
                >
                  <span>Open Fullscreen</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPdf(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF with #page=N parameter */}
            <div className="flex-1 bg-slate-900 relative">
              <iframe
                src={previewPdf.url}
                className="w-full h-full border-0"
                title={`${previewPdf.docName} - Page ${previewPdf.pageNumber}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
