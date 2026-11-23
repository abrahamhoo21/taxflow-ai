'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, X, Loader2, Check } from 'lucide-react';
import { ExtractedNotes } from '@/types/rag';

export function NotesExtractorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState(
    'Met Mr. Wong from Berjaya Food (012-9876543, email: wong@berjaya.com). They need SST 8% compliance review for 15 retail branches. Budget roughly RM 35,000. Stage is qualified. Send formal proposal by this Friday.'
  );
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedNotes | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Listen for custom open event triggered from header buttons
  useEffect(() => {
    const handleCustomOpen = () => {
      setIsOpen(true);
      setSaveSuccess(false);
    };
    window.addEventListener('open-notes-extractor', handleCustomOpen);
    return () => window.removeEventListener('open-notes-extractor', handleCustomOpen);
  }, []);

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
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#0f172a] hover:bg-slate-800 text-purple-300 font-semibold text-sm border border-purple-500/30 shadow-xl transition transform hover:scale-105"
      >
        <FileText className="w-4 h-4 text-purple-400" />
        <span>Extract Notes AI (Option B)</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Meeting Notes Extractor (Human-in-the-Loop)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Paste unstructured sales chat / meeting notes ➔ AI extracts contacts &amp; deals ➔ You review before saving
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Raw WhatsApp / Sales Meeting Notes:
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste unstructured notes..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <button
                onClick={handleExtract}
                disabled={loading || !rawText.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting with Gemini Flash JSON Schema...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract with AI</span>
                  </>
                )}
              </button>

              {/* Structured Output Form for Human-in-the-Loop Review */}
              {extracted && (
                <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      <span>Human-in-the-Loop Verification (Editable)</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-semibold">
                      Strict Schema
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Contact Name:</span>
                      <input
                        type="text"
                        value={extracted.contactName}
                        onChange={e => setExtracted({ ...extracted, contactName: e.target.value })}
                        className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Company Name:</span>
                      <input
                        type="text"
                        value={extracted.companyName}
                        onChange={e => setExtracted({ ...extracted, companyName: e.target.value })}
                        className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Deal Value (RM):</span>
                      <input
                        type="number"
                        value={extracted.dealValueRM || 0}
                        onChange={e => setExtracted({ ...extracted, dealValueRM: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Pipeline Stage:</span>
                      <select
                        value={extracted.stage || 'Qualified'}
                        onChange={e => setExtracted({ ...extracted, stage: e.target.value as ExtractedNotes['stage'] })}
                        className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
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
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-sm text-center font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Successfully saved contact and opportunity into CRM! Reloading...</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              {extracted && (
                <button
                  onClick={handleConfirmSave}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm &amp; Save to CRM</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
