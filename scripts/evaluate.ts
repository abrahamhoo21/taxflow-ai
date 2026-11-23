import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { getEmbedding } from '../src/lib/gemini';
import { supabaseAdmin } from '../src/lib/supabase';

interface TestCase {
  id: number;
  question: string;
  expectedDoc: string;
  expectedPage: number;
  expectedKeywords: string[];
}

const TEST_SUITE: TestCase[] = [
  {
    id: 1,
    question: "When is Phase 1 of LHDN e-invoicing mandatory and what is the turnover threshold?",
    expectedDoc: "01_LHDN_eInvoice_General_Guidelines_v3.0.txt",
    expectedPage: 6,
    expectedKeywords: ["1 August 2024", "100,000,000", "Phase 1"],
  },
  {
    id: 2,
    question: "What are the core data fields required for an e-invoice in Malaysia?",
    expectedDoc: "01_LHDN_eInvoice_General_Guidelines_v3.0.txt",
    expectedPage: 14,
    expectedKeywords: ["55", "data fields", "TIN", "digital signature"],
  },
  {
    id: 3,
    question: "What is the time window allowed for a supplier to cancel a validated e-invoice in MyInvois?",
    expectedDoc: "01_LHDN_eInvoice_General_Guidelines_v3.0.txt",
    expectedPage: 22,
    expectedKeywords: ["72 hours", "cancel"],
  },
  {
    id: 4,
    question: "What is the deadline for submitting a monthly consolidated e-invoice for retail B2C transactions?",
    expectedDoc: "02_LHDN_eInvoice_Specific_Guidelines.txt",
    expectedPage: 4,
    expectedKeywords: ["7 calendar days", "consolidated"],
  },
  {
    id: 5,
    question: "When must a Malaysian buyer issue a self-billed e-invoice for imported services from foreign suppliers?",
    expectedDoc: "02_LHDN_eInvoice_Specific_Guidelines.txt",
    expectedPage: 11,
    expectedKeywords: ["Self-Billed", "foreign supplier", "payment made"],
  },
  {
    id: 6,
    question: "What service categories remain taxed at the 6% Service Tax rate instead of 8% starting March 2024?",
    expectedDoc: "03_RMCD_Service_Tax_Guide_8_Percent_2024.txt",
    expectedPage: 2,
    expectedKeywords: ["Food and Beverage", "F&B", "Telecommunications", "6%"],
  },
  {
    id: 7,
    question: "What is the service tax registration threshold for general professional services under Group G?",
    expectedDoc: "03_RMCD_Service_Tax_Guide_8_Percent_2024.txt",
    expectedPage: 12,
    expectedKeywords: ["RM 500,000", "Group G"],
  },
  {
    id: 8,
    question: "What is the flat sales tax rate on Low Value Goods (LVG) imported into Malaysia?",
    expectedDoc: "04_RMCD_Sales_Tax_Low_Value_Goods_LVG.txt",
    expectedPage: 5,
    expectedKeywords: ["10%", "flat rate", "500"],
  },
  {
    id: 9,
    question: "What is the withholding tax rate under Section 107A for contract payments to non-resident contractors?",
    expectedDoc: "05_LHDN_Public_Ruling_1_2024_Withholding_Tax.txt",
    expectedPage: 6,
    expectedKeywords: ["10%", "3%", "13%", "Section 107A"],
  },
  {
    id: 10,
    question: "What is the penalty and consequence of failing to remit withholding tax to LHDN within 1 month?",
    expectedDoc: "05_LHDN_Public_Ruling_1_2024_Withholding_Tax.txt",
    expectedPage: 12,
    expectedKeywords: ["10%", "disallowed as a tax deduction", "Section 39(1)(j)"],
  },
];

async function runEvaluation() {
  console.log('🧪 Starting RAG Retrieval Evaluation Benchmark (YYC taxPOD Assessment)...\n');
  console.log(`Running evaluation across ${TEST_SUITE.length} statutory Malaysian tax test queries.\n`);

  let hits = 0;
  const resultsSummary = [];

  for (const test of TEST_SUITE) {
    console.log(`----------------------------------------------------------------------`);
    console.log(`Test #${test.id}: "${test.question}"`);
    console.log(`Target: ${test.expectedDoc} (Page ${test.expectedPage})`);

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
    const docMatched = matchedChunks.some((c: { doc_name: string }) => c.doc_name === test.expectedDoc);
    
    const keywordMatches = test.expectedKeywords.filter(kw => 
      matchedChunks.some((c: { chunk_content: string }) => c.chunk_content.toLowerCase().includes(kw.toLowerCase()))
    );

    const isHit = docMatched && keywordMatches.length >= 1;

    if (isHit) {
      hits++;
      console.log(`✅ Result: HIT (Top score: ${topHit.similarity.toFixed(3)} | Doc: ${topHit.doc_name} Page: ${topHit.page_number})`);
      resultsSummary.push({ id: test.id, hit: true, score: topHit.similarity });
    } else {
      console.log(`❌ Result: MISS (Expected: ${test.expectedDoc}, Top retrieved: ${topHit.doc_name})`);
      resultsSummary.push({ id: test.id, hit: false, reason: 'Document mismatch' });
    }

    // Gentle pacing for API calls
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  const hitRate = (hits / TEST_SUITE.length) * 100;
  console.log(`\n======================================================================`);
  console.log(`📊 EVALUATION REPORT:`);
  console.log(`Total Questions Tested: ${TEST_SUITE.length}`);
  console.log(`Successful Hits (Top-3 Retrieval): ${hits}`);
  console.log(`Retrieval Hit Rate: ${hitRate.toFixed(1)}%`);
  console.log(`======================================================================\n`);
}

runEvaluation().catch(console.error);
