// ====================================================================
// Centralized Tax & RAG Chatbot Constants (Zero Hardcoding Principle)
// ====================================================================

export interface SuggestedQuestion {
  id: string;
  category: string;
  badge: string;
  question: string;
}

export const TAX_CHAT_CONFIG = {
  TITLE: 'YYC Tax Intelligence Assistant',
  BADGE: 'RAG Active',
  SUBTITLE: 'Grounded on 5 Official LHDN / RMCD Publications',
  WELCOME_MESSAGE:
    'Welcome to the YYC Tax Assistant. I can help you verify statutory Malaysian tax regulations, including LHDN e-Invoicing Guidelines (v3.0), Service Tax (SST 8%), and Withholding Tax rules.\n\nSelect a sample question below or type your inquiry to get started:',
  INPUT_PLACEHOLDER: 'Ask about LHDN e-invoice timeline, SST 8%, self-billed rules...',
  SUGGESTED_QUESTIONS: [
    {
      id: 'e-inv-timeline',
      category: 'e-Invoicing',
      badge: 'Implementation Timeline',
      question: 'When is Phase 1 of LHDN e-invoicing mandatory and what is the turnover threshold?',
    },
    {
      id: 'self-billed',
      category: 'e-Invoicing',
      badge: 'Self-Billed e-Invoice',
      question: 'When must a Malaysian buyer issue a self-billed e-invoice for imported services from foreign suppliers?',
    },
    {
      id: 'cancel-window',
      category: 'Compliance',
      badge: '72h Cancel Window',
      question: 'What is the time window allowed for a supplier to cancel a validated e-invoice in MyInvois?',
    },
    {
      id: 'sst-rate',
      category: 'SST',
      badge: '8% Service Tax Scope',
      question: 'What services are subject to the revised 8% Service Tax rate, and which services remain at 6%?',
    },
    {
      id: 'consolidated-b2c',
      category: 'Retail',
      badge: 'Consolidated B2C',
      question: 'What is the deadline for submitting a monthly consolidated e-invoice for retail B2C transactions?',
    },
    {
      id: 'withholding-tax',
      category: 'Cross-Border',
      badge: 'Withholding Tax',
      question: 'What are the withholding tax obligations and deduction percentages under Section 107A for non-resident contractors?',
    },
  ] as SuggestedQuestion[],
} as const;
