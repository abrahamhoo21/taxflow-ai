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

// RAG Engine Defaults
export const RAG_DEFAULTS = {
  SIMILARITY_THRESHOLD: 0.50,
  TOP_K_CHUNKS: 4,
  CHUNK_TOKEN_SIZE: 800,
  CHUNK_OVERLAP: 150,
} as const;
