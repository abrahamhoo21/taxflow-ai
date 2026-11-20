'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Opportunity, Activity } from '@/types/crm';

export default function DashboardPage() {
  const [totalLeads, setTotalLeads] = useState<number>(5);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'Call',
      description: 'Discovery call with Dato Sri Jeffrey regarding Phase 2 e-invoicing roadmap.',
      date: 'Today at 2:30 PM',
      lead_name: 'Dato Sri Jeffrey Lim',
      company_name: 'Mega Logistics Bhd',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'Meeting',
      description: 'Discussed SST 8% audit scope for 15 outlets. Budget agreed at RM 35k.',
      date: 'Yesterday at 4:00 PM',
      lead_name: 'Cynthia Wong',
      company_name: 'Berjaya Food Sdn Bhd',
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'Note',
      description: 'Signed annual taxPOD corporate subscription for 200 finance users!',
      date: '3 days ago',
      lead_name: 'Marcus Tan',
      company_name: 'Sunway Tech Group',
      created_at: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    // Fetch opportunities
    fetch('/api/opportunities')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOpportunities(data);
      })
      .catch(() => {});

    // Fetch leads count
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTotalLeads(data.length);
      })
      .catch(() => {});
  }, []);

  const openDeals = opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost');
  const wonDeals = opportunities.filter(o => o.stage === 'Won');
  const totalPipelineRM = opportunities.reduce((acc, curr) => acc + Number(curr.value_rm || 0), 0);
  const wonPipelineRM = wonDeals.reduce((acc, curr) => acc + Number(curr.value_rm || 0), 0);

  return (
    <div className="p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">High-level sales metrics &amp; real-time pipeline valuation (RM)</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pipeline"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-sm"
          >
            View Kanban Pipeline ➔
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Total Contacts</div>
          <div className="text-2xl font-black text-slate-100 mt-1">{totalLeads}</div>
          <div className="text-[11px] text-emerald-400 mt-1">↑ Active clients &amp; prospects</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Open Opportunities</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{openDeals.length} Deals</div>
          <div className="text-[11px] text-slate-400 mt-1">In active negotiations</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Total Pipeline Value</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            RM {totalPipelineRM.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-1">Across 5 pipeline stages</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-400">Deals Won (Revenue)</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            RM {wonPipelineRM.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1">{wonDeals.length} closed contracts</div>
        </div>
      </div>

      {/* Middle Row: Recent Activity Feed & Tax RAG Knowledge Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-100">Recent Activity Feed</h2>
            <span className="text-[11px] text-slate-400">Chronological interaction trail</span>
          </div>

          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-slate-800/60 last:border-b-0">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 text-xs">
                  {act.type === 'Call' ? '📞' : act.type === 'Meeting' ? '🤝' : '📝'}
                </span>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{act.company_name}</span>
                    <span className="text-[10px] text-slate-500">{act.date}</span>
                  </div>
                  <div className="text-slate-400 mt-0.5">{act.description}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Contact: {act.lead_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Base Status Card */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-100 mb-2">Malaysian Tax RAG Status</h2>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 mb-3 space-y-2">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>5 Official Documents Ingested</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 pl-4 list-disc">
                <li>LHDN e-Invoice Guidelines v3.0</li>
                <li>LHDN Specific Guidelines (B2B/B2C)</li>
                <li>RMCD Service Tax Guide (8% Rate)</li>
                <li>RMCD Sales Tax on LVG Guide (10%)</li>
                <li>LHDN Public Ruling 1/2024 (WHT)</li>
              </ul>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Vector Engine: <span className="text-blue-400 font-mono">pgvector (768d HNSW)</span></div>
              <div>LLM Reasoning: <span className="text-purple-400 font-mono">gemini-1.5-flash</span></div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Click the floating button on the bottom-right to query tax laws.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
