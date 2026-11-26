import { LeadStatus, OpportunityStage, ActivityType } from '@/types/crm';

// ====================================================================
// Centralized CRM Constants (Zero Hardcoding Principle)
// ====================================================================

export const LEAD_STATUSES: Record<string, LeadStatus> = {
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  CUSTOMER: 'Customer',
} as const;

export const OPPORTUNITY_STAGES: Record<string, OpportunityStage> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  WON: 'Won',
  LOST: 'Lost',
} as const;

export const KANBAN_STAGES: OpportunityStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Won',
];

export const ACTIVITY_TYPES: Record<string, ActivityType> = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
} as const;

// Currency & Formatting Defaults
export const CURRENCY = {
  CODE: 'MYR',
  SYMBOL: 'RM',
  LOCALE: 'en-MY',
} as const;

export function formatRM(amount: number): string {
  return `RM ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface StageTheme {
  borderTop: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorderLeft: string;
  cardHoverBorder: string;
  cardBg: string;
  priceText: string;
  dotColor: string;
  selectBg: string;
  selectText: string;
  selectBorder: string;
}

export const STAGE_THEMES: Record<OpportunityStage, StageTheme> = {
  New: {
    borderTop: 'border-t-blue-500',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
    cardBorderLeft: 'border-l-blue-500',
    cardHoverBorder: 'hover:border-blue-500/50',
    cardBg: 'bg-slate-900/95',
    priceText: 'text-blue-400',
    dotColor: 'bg-blue-500',
    selectBg: 'bg-blue-950/40',
    selectText: 'text-blue-300',
    selectBorder: 'border-blue-500/40',
  },
  Contacted: {
    borderTop: 'border-t-indigo-500',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    cardBorderLeft: 'border-l-indigo-500',
    cardHoverBorder: 'hover:border-indigo-500/50',
    cardBg: 'bg-slate-900/95',
    priceText: 'text-indigo-400',
    dotColor: 'bg-indigo-500',
    selectBg: 'bg-indigo-950/40',
    selectText: 'text-indigo-300',
    selectBorder: 'border-indigo-500/40',
  },
  Qualified: {
    borderTop: 'border-t-amber-500',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    cardBorderLeft: 'border-l-amber-500',
    cardHoverBorder: 'hover:border-amber-500/50',
    cardBg: 'bg-slate-900/95',
    priceText: 'text-amber-400',
    dotColor: 'bg-amber-500',
    selectBg: 'bg-amber-950/40',
    selectText: 'text-amber-300',
    selectBorder: 'border-amber-500/40',
  },
  Proposal: {
    borderTop: 'border-t-purple-500',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
    cardBorderLeft: 'border-l-purple-500',
    cardHoverBorder: 'hover:border-purple-500/50',
    cardBg: 'bg-slate-900/95',
    priceText: 'text-purple-400',
    dotColor: 'bg-purple-500',
    selectBg: 'bg-purple-950/40',
    selectText: 'text-purple-300',
    selectBorder: 'border-purple-500/40',
  },
  Won: {
    borderTop: 'border-t-emerald-500',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    cardBorderLeft: 'border-l-emerald-500',
    cardHoverBorder: 'hover:border-emerald-500/50',
    cardBg: 'bg-slate-900/95',
    priceText: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    selectBg: 'bg-emerald-950/40',
    selectText: 'text-emerald-300',
    selectBorder: 'border-emerald-500/40',
  },
  Lost: {
    borderTop: 'border-t-rose-500',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    cardBorderLeft: 'border-l-rose-500',
    cardHoverBorder: 'hover:border-rose-500/50',
    cardBg: 'bg-slate-900/95',
    priceText: 'text-rose-400',
    dotColor: 'bg-rose-500',
    selectBg: 'bg-rose-950/40',
    selectText: 'text-rose-300',
    selectBorder: 'border-rose-500/40',
  },
};

// RAG Engine Defaults
export const RAG_DEFAULTS = {
  SIMILARITY_THRESHOLD: 0.50,
  TOP_K_CHUNKS: 4,
  CHUNK_TOKEN_SIZE: 800,
  CHUNK_OVERLAP: 150,
} as const;
