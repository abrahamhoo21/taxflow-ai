import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getEmbedding } from '../src/lib/gemini';
import { supabaseAdmin } from '../src/lib/supabase';

interface TestCase {
  id: number;
  question: string;
  expectedDoc: string | string[];
  expectedKeywords: string[];
}

const TEST_SUITE: TestCase[] = [
  {
    id: 1,
    question: "When is Phase 1 of LHDN e-invoicing mandatory and what is the turnover threshold?",
    expectedDoc: "IRBM-e-Invoice-Guideline.pdf",
    expectedKeywords: ["1 August 2024", "100", "million"],
  },
  {
    id: 2,
    question: "What is the implementation timeline date for Phase 2 taxpayers with turnover between RM25 million and RM100 million?",
    expectedDoc: "IRBM-e-Invoice-Guideline.pdf",
    expectedKeywords: ["1 January 2025", "25 million"],
  },
  {
    id: 3,
    question: "What are the required core fields or digital signature mechanisms in the e-invoice workflow?",
    expectedDoc: "IRBM-e-Invoice-Guideline.pdf",
    expectedKeywords: ["digital signature", "TIN", "invoice", "fields"],
  },
  {
    id: 4,
    question: "What is the time window allowed for a buyer or supplier to cancel or reject an e-invoice in MyInvois?",
    expectedDoc: ["lhdnm-e-invoice-general-faqs.pdf", "IRBM-e-Invoice-Guideline.pdf"],
    expectedKeywords: ["72 hours", "cancel", "reject"],
  },
  {
    id: 5,
    question: "How does consolidated e-invoicing work for retail transactions where buyers do not request an e-invoice?",
    expectedDoc: "lhdnm-e-invoice-general-faqs.pdf",
    expectedKeywords: ["consolidated", "buyer", "invoice"],
  },
  {
    id: 6,
    question: "What qualifies as a small value asset for special capital allowances under Public Ruling No. 4/2026?",
    expectedDoc: "PR-No.4_2026-Special-Allowances-For-Small-Value-Assets.pdf",
    expectedKeywords: ["small value asset", "allowance", "2,000"],
  },
  {
    id: 7,
    question: "What is the maximum total cap of special allowance for small value assets in a year of assessment?",
    expectedDoc: "PR-No.4_2026-Special-Allowances-For-Small-Value-Assets.pdf",
    expectedKeywords: ["20,000", "allowance", "year of assessment"],
  },
  {
    id: 8,
    question: "What is the percentage restriction or cap on tax deductions for charitable cash gifts under Section 44(6)?",
    expectedDoc: "20261104-PR-5_Taxation-Of-A-Resident-Individualpart-I-Gifts-Or-Contributions-And-Allowable-Deductions.pdf",
    expectedKeywords: ["10%", "aggregate income", "gifts", "deduction"],
  },
  {
    id: 9,
    question: "Are gifts of medical equipment or healthcare facilities eligible for tax deduction for resident individuals?",
    expectedDoc: "20261104-PR-5_Taxation-Of-A-Resident-Individualpart-I-Gifts-Or-Contributions-And-Allowable-Deductions.pdf",
    expectedKeywords: ["medical equipment", "deduction", "health"],
  },
  {
    id: 10,
    question: "Under what statutory sections of the Income Tax Act 1967 are bilateral credit and unilateral credit claimed?",
    expectedDoc: "pr_03_2026-bilateral-credit-and-unilateral-credit.pdf",
    expectedKeywords: ["132", "133", "credit"],
  },
];

async function runEvaluation() {
  console.log('🧪 Starting RAG Retrieval Evaluation Benchmark (100% Real PDF Source - YYC Assessment)...\n');
  console.log(`Running evaluation across ${TEST_SUITE.length} statutory Malaysian tax test queries.\n`);

  let hits = 0;
  const resultsSummary = [];

  for (const test of TEST_SUITE) {
    console.log(`----------------------------------------------------------------------`);
    console.log(`Test #${test.id}: "${test.question}"`);
    console.log(`Target: ${test.expectedDoc}`);

    const queryVector = await getEmbedding(test.question);

    const { data: matchedChunks, error } = await supabaseAdmin.rpc('match_tax_chunks', {
      query_embedding: queryVector,
      match_threshold: 0.50,
      match_count: 3,
    });

    if (error || !matchedChunks || matchedChunks.length === 0) {
      console.log(`❌ Result: MISS (No chunks retrieved above threshold)`);
      resultsSummary.push({ id: test.id, hit: false, reason: 'Empty retrieval' });
      continue;
    }

    const topHit = matchedChunks[0];
    const expectedDocs = Array.isArray(test.expectedDoc) ? test.expectedDoc : [test.expectedDoc];
    const docMatched = matchedChunks.some((c: { doc_name: string }) => expectedDocs.includes(c.doc_name));

    const keywordMatches = test.expectedKeywords.filter(kw =>
      matchedChunks.some((c: { chunk_content: string }) => c.chunk_content.toLowerCase().includes(kw.toLowerCase()))
    );

    const isHit = docMatched && keywordMatches.length >= 1;

    if (isHit) {
      hits++;
      console.log(`✅ Result: HIT (Top score: ${topHit.similarity.toFixed(3)} | Doc: ${topHit.doc_name} Page: ${topHit.page_number})`);
      resultsSummary.push({ id: test.id, hit: true, score: topHit.similarity });
    } else {
      console.log(`❌ Result: MISS (Expected: ${Array.isArray(test.expectedDoc) ? test.expectedDoc.join(' / ') : test.expectedDoc}, Top retrieved: ${topHit.doc_name})`);
      resultsSummary.push({ id: test.id, hit: false, reason: 'Document mismatch' });
    }

    // Gentle pacing for API calls
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const hitRate = (hits / TEST_SUITE.length) * 100;
  console.log(`\n======================================================================`);
  console.log(`📊 EVALUATION REPORT (Official Malaysian Tax Documents):`);
  console.log(`Total Questions Tested: ${TEST_SUITE.length}`);
  console.log(`Successful Hits (Top-3 Retrieval): ${hits}`);
  console.log(`Retrieval Hit Rate: ${hitRate.toFixed(1)}%`);
  console.log(`======================================================================\n`);
}

runEvaluation().catch(console.error);
