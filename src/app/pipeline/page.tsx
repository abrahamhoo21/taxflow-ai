'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Building2 } from 'lucide-react';
import { Opportunity, OpportunityStage } from '@/types/crm';
import { STAGE_THEMES } from '@/constants/crm';

const STAGES: OpportunityStage[] = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'];

export default function PipelineKanbanPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/opportunities');
      const data = await res.json();
      if (Array.isArray(data)) setOpportunities(data);
    } catch {
      console.error('Error fetching opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  const handleStageChange = async (oppId: string, newStage: OpportunityStage) => {
    // Optimistic UI update
    setOpportunities(prev =>
      prev.map(o => (o.id === oppId ? { ...o, stage: newStage } : o))
    );

    try {
      await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: oppId, stage: newStage }),
      });
    } catch {
      fetchOpps(); // Rollback on error
    }
  };

  return (
    <div className="p-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Opportunity Pipeline (Kanban)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Grouped by 5 sales stages. All deal values calculated in <span className="text-amber-400 font-semibold">Malaysian Ringgit (RM)</span>.
          </p>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-notes-extractor'));
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-sm flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Parse Meeting Notes</span>
        </button>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter(o => o.stage === stage);
          const stageTotalRM = stageOpps.reduce((acc, curr) => acc + Number(curr.value_rm || 0), 0);
          const theme = STAGE_THEMES[stage] || STAGE_THEMES.New;

          return (
            <div
              key={stage}
              className={`bg-[#0e1424] rounded-2xl p-4 border border-slate-800 border-t-2 ${theme.borderTop} flex flex-col min-h-[550px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${theme.dotColor}`}></span>
                  <span className="font-bold text-sm text-slate-100">{stage}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} font-mono font-semibold`}>
                    {stageOpps.length}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${theme.priceText}`}>
                  RM {stageTotalRM.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </span>
              </div>

              {/* Cards in this stage */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-xs text-slate-500 text-center py-6">Loading deals...</div>
                ) : stageOpps.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-10">No deals in {stage}</div>
                ) : (
                  stageOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className={`p-4 rounded-xl ${theme.cardBg} border border-slate-800/90 border-l-4 ${theme.cardBorderLeft} ${theme.cardHoverBorder} shadow-sm transition space-y-2.5 group`}
                    >
                      <div className="font-semibold text-sm text-slate-100 leading-snug group-hover:text-white transition">
                        {opp.title}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{opp.lead?.company || 'Corporate Client'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
                        <span className={`font-bold font-mono text-sm ${theme.priceText}`}>
                          RM {Number(opp.value_rm).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </span>
                        
                        {/* Quick stage transition dropdown */}
                        <select
                          value={opp.stage}
                          onChange={(e) => handleStageChange(opp.id, e.target.value as OpportunityStage)}
                          className={`${theme.selectBg} ${theme.selectText} border ${theme.selectBorder} rounded-lg px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer transition`}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s} className="bg-slate-900 text-slate-200">{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
