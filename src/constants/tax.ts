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
  SUBTITLE: 'Grounded on 5 Official LHDN PDF Guidelines & Rulings',
  WELCOME_MESSAGE:
    'Welcome to the YYC Tax Assistant. I can help you verify statutory Malaysian tax regulations grounded directly on official LHDN documents, including e-Invoicing Guidelines, Public Rulings on Small Value Assets, Resident Individual Deductions, and Double Taxation Relief.\n\nSelect a sample question below or type your inquiry to get started:',
  INPUT_PLACEHOLDER: 'Ask about e-invoice timeline, small value assets, gift deduction limits...',
  SUGGESTED_QUESTIONS: [
    {
      id: 'e-inv-timeline',
      category: 'e-Invoicing',
      badge: 'Implementation Timeline',
      question: 'When is Phase 1 of LHDN e-invoicing mandatory and what is the turnover threshold?',
    },
    {
      id: 'cancel-window',
      category: 'Compliance',
      badge: '72h Cancel Window',
      question: 'What is the time window allowed for a buyer or supplier to cancel or reject an e-invoice in MyInvois?',
    },
    {
      id: 'small-value-qualify',
      category: 'Capital Allowance',
      badge: 'Small Value Assets',
      question: 'What qualifies as a small value asset for special capital allowances under Public Ruling No. 4/2026?',
    },
    {
      id: 'small-value-cap',
      category: 'Capital Allowance',
      badge: 'RM20,000 Cap Rule',
      question: 'What is the maximum total cap of special allowance for small value assets in a year of assessment?',
    },
    {
      id: 'charitable-gifts',
      category: 'Personal Tax',
      badge: '10% Deduction Cap',
      question: 'What is the percentage restriction or cap on tax deductions for charitable cash gifts under Section 44(6)?',
    },
    {
      id: 'foreign-tax-credit',
      category: 'Cross-Border',
      badge: 'Bilateral / Unilateral Credit',
      question: 'Under what statutory sections of the Income Tax Act 1967 are bilateral credit and unilateral credit claimed?',
    },
  ] as SuggestedQuestion[],
} as const;

/**
 * Official Online Reference Links (LHDN Official Portals & Publications)
 */
export const OFFICIAL_TAX_DOC_LINKS: Record<string, string> = {
  'IRBM-e-Invoice-Guideline.pdf': 'https://www.hasil.gov.my/wp-content/uploads/IRBM-e-Invoice-Guideline.pdf',
  'lhdnm-e-invoice-general-faqs.pdf': 'https://www.hasil.gov.my/wp-content/uploads/lhdnm-e-invoice-general-faqs.pdf',
  'PR-No.4_2026-Special-Allowances-For-Small-Value-Assets.pdf': 'https://www.hasil.gov.my/wp-content/uploads/PR-No.4_2026-Special-Allowances-For-Small-Value-Assets.pdf',
  '20261104-PR-5_Taxation-Of-A-Resident-Individualpart-I-Gifts-Or-Contributions-And-Allowable-Deductions.pdf': 'https://www.hasil.gov.my/wp-content/uploads/20261104-PR-5_Taxation-Of-A-Resident-Individualpart-I-Gifts-Or-Contributions-And-Allowable-Deductions.pdf',
  'pr_03_2026-bilateral-credit-and-unilateral-credit.pdf': 'https://www.hasil.gov.my/wp-content/uploads/pr_03_2026-bilateral-credit-and-unilateral-credit.pdf',
};

export function getOfficialDocUrl(docName: string): string {
  return OFFICIAL_TAX_DOC_LINKS[docName] || 'https://www.hasil.gov.my/';
}

/**
 * Strict Document Ingestion & Validation Guardrails
 * Enforces file size limits, header validation, content duplicate checks, and tax domain relevance.
 */
export const RAG_INGESTION_CONFIG = {
  MAX_FILE_SIZE_BYTES: 30 * 1024 * 1024, // 30 MB maximum PDF size
  MIN_DOCUMENT_TEXT_LENGTH: 100,          // Minimum total extractable characters
  PDF_MAGIC_BYTES: '%PDF-',              // Valid PDF header identifier
  TAX_DOMAIN_KEYWORDS: [
    'tax',
    'cukai',
    'lhdn',
    'irbm',
    'hasil',
    'invois',
    'invoice',
    'allowance',
    'elaun',
    'ruling',
    'guideline',
    'garis panduan',
    'act',
    'akta',
    'schedule',
    'jadual',
    'section',
    'seksyen',
    'rmcd',
    'kastam',
    'customs',
    'sst',
    'relief',
    'pelepasan',
    'deduction',
    'potongan',
    'assessment',
    'taksiran',
    'qualifying',
    'plant',
    'expenditure',
    'resident',
    'individual',
  ],
} as const;
