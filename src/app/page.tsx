'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Coins, 
  TrendingUp, 
  Award, 
  PhoneCall, 
  Users2, 
  FileText, 
  ArrowRight,
  Database,
  Bot
} from 'lucide-react';
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
    <div className="p-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">High-level sales metrics &amp; real-time pipeline valuation in Malaysian Ringgit (RM)</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pipeline"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-sm"
          >
            <span>View Kanban Pipeline</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Contacts</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-100 mt-2">{totalLeads}</div>
          <div className="text-xs text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active clients &amp; prospects</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Open Opportunities</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-400 mt-2">{openDeals.length} Deals</div>
          <div className="text-xs text-slate-400 mt-2">In active negotiations</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Pipeline Value</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
            RM {totalPipelineRM.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-amber-400/80 mt-2 font-medium">Across 5 pipeline stages</div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Deals Won (Revenue)</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            RM {wonPipelineRM.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-emerald-400/80 mt-2 font-medium">{wonDeals.length} closed contracts</div>
        </div>
      </div>

      {/* Middle Row: Recent Activity Feed & Tax RAG Knowledge Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Timeline */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-base text-slate-100">Recent Activity Feed</h2>
              <span className="text-xs text-slate-400">Chronological interaction trail across sales leads</span>
            </div>
          </div>

          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 mt-0.5">
                  {act.type === 'Call' ? (
                    <PhoneCall className="w-4 h-4" />
                  ) : act.type === 'Meeting' ? (
                    <Users2 className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{act.company_name}</span>
                    <span className="text-xs text-slate-400 font-mono">{act.date}</span>
                  </div>
                  <div className="text-slate-300 mt-1 leading-relaxed">{act.description}</div>
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    <span>Contact: {act.lead_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge Base Status Card */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-base text-slate-100 mb-3">Malaysian Tax RAG Status</h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mb-4 space-y-3">
              <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>5 Official Documents Ingested</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-4 list-disc leading-relaxed">
                <li>LHDN e-Invoice Guidelines v3.0</li>
                <li>LHDN Specific Guidelines (B2B/B2C)</li>
                <li>RMCD Service Tax Guide (8% Rate)</li>
                <li>RMCD Sales Tax on LVG Guide (10%)</li>
                <li>LHDN Public Ruling 1/2024 (WHT)</li>
              </ul>
            </div>
            <div className="text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Vector: <strong className="text-slate-200 font-mono">pgvector (768d HNSW)</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Model: <strong className="text-slate-200 font-mono">gemini-flash-lite</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">Click the floating button on the bottom-right to query tax laws.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
