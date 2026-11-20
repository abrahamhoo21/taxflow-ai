'use client';

import React, { useState } from 'react';
import { ExtractedNotes } from '@/types/rag';

export function NotesExtractorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState(
    'Met Mr. Wong from Berjaya Food (012-9876543, email: wong@berjaya.com). They need SST 8% compliance review for 15 retail branches. Budget roughly RM 35,000. Stage is qualified. Send formal proposal by this Friday.'
  );
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedNotes | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Trigger from custom global event or click
  const handleOpen = () => {
    setIsOpen(true);
    setSaveSuccess(false);
  };

  const handleExtract = async () => {
    if (!rawText.trim() || loading) return;
    setLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/ai/extract-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const data: ExtractedNotes = await res.json();
      setExtracted(data);
    } catch {
      alert('Failed to extract structured data. Please ensure Gemini API key is valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!extracted) return;
    try {
      // 1. Create Lead
      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extracted.contactName,
          company: extracted.companyName,
          phone: extracted.phone || '012-0000000',
          email: extracted.email || `${extracted.contactName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          status: 'Prospect',
        }),
      });
      const lead = await leadRes.json();

      // 2. Create Opportunity
      if (lead?.id) {
        await fetch('/api/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: lead.id,
            title: extracted.opportunityTitle || `${extracted.companyName} Tax Advisory`,
            value_rm: extracted.dealValueRM || 25000,
            stage: extracted.stage || 'Qualified',
          }),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSaveSuccess(false);
        window.location.reload();
      }, 1500);
    } catch {
      alert('Error saving extracted records to database.');
    }
  };

  return (
    <>
      {/* Global Shortcut Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0f172a] hover:bg-slate-800 text-purple-300 font-semibold text-xs border border-purple-500/30 shadow-lg transition"
      >
        <span>📝</span>
        <span>Extract Notes AI (Option B)</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <span>✨</span> Meeting Notes Extractor (Human-in-the-Loop)
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Paste unstructured sales chat / meeting notes ➔ AI extracts contacts &amp; deals ➔ You review before saving
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Raw WhatsApp / Sales Meeting Notes:
                </label>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste unstructured notes..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleExtract}
                disabled={loading || !rawText.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? '⏳' : '⚡'}</span>
                <span>{loading ? 'Extracting with Gemini Flash JSON Schema...' : 'Extract with AI'}</span>
              </button>

              {/* Structured Output Form for Human-in-the-Loop Review */}
              {extracted && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">
                      🔍 Human-in-the-Loop Verification (Editable)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                      Strict Schema
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Contact Name:</span>
                      <input
                        type="text"
                        value={extracted.contactName}
                        onChange={e => setExtracted({ ...extracted, contactName: e.target.value })}
                        className="w-full mt-0.5 p-2 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Company Name:</span>
                      <input
                        type="text"
                        value={extracted.companyName}
                        onChange={e => setExtracted({ ...extracted, companyName: e.target.value })}
                        className="w-full mt-0.5 p-2 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Deal Value (RM):</span>
                      <input
                        type="number"
                        value={extracted.dealValueRM || 0}
                        onChange={e => setExtracted({ ...extracted, dealValueRM: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-0.5 p-2 rounded bg-slate-900 border border-slate-700 text-xs text-amber-400 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Pipeline Stage:</span>
                      <select
                        value={extracted.stage || 'Qualified'}
                        onChange={e => setExtracted({ ...extracted, stage: e.target.value as ExtractedNotes['stage'] })}
                        className="w-full mt-0.5 p-2 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Won">Won</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs text-center font-semibold">
                  ✓ Successfully saved contact and opportunity into CRM! Reloading...
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              {extracted && (
                <button
                  onClick={handleConfirmSave}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20"
                >
                  ✓ Confirm &amp; Save to CRM
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
