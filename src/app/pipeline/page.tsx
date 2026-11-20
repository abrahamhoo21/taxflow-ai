'use client';

import React, { useEffect, useState } from 'react';
import { Opportunity, OpportunityStage } from '@/types/crm';

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
    <div className="p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Opportunity Pipeline (Kanban)</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Grouped by sales stages. All deal values calculated in <span className="text-amber-400 font-semibold">Malaysian Ringgit (RM)</span>.
          </p>
        </div>
        <button
          onClick={() => alert('You can use Option B (Extract Notes AI) on the bottom-left to auto-create opportunities with AI!')}
          className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition shadow-sm"
        >
          ✨ Extract from Notes (AI)
        </button>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter(o => o.stage === stage);
          const stageTotalRM = stageOpps.reduce((acc, curr) => acc + Number(curr.value_rm || 0), 0);

          return (
            <div
              key={stage}
              className="bg-[#0f172a] rounded-2xl p-3 border border-slate-800 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-200">{stage}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {stageOpps.length}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-semibold">
                  RM {stageTotalRM.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </span>
              </div>

              {/* Cards in this stage */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-[11px] text-slate-500 text-center py-4">Loading...</div>
                ) : stageOpps.length === 0 ? (
                  <div className="text-[11px] text-slate-600 text-center py-8">No deals in {stage}</div>
                ) : (
                  stageOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 shadow-sm transition space-y-2"
                    >
                      <div className="font-semibold text-xs text-slate-100 leading-snug">
                        {opp.title}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {opp.lead?.company || 'Corporate Client'}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                        <span className="font-bold text-amber-400 font-mono">
                          RM {Number(opp.value_rm).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        
                        {/* Quick stage transition dropdown */}
                        <select
                          value={opp.stage}
                          onChange={e => handleStageChange(opp.id, e.target.value as OpportunityStage)}
                          className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                        >
                          {STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
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
