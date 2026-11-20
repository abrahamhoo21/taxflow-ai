import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.');
}

export const genAI = new GoogleGenerativeAI(apiKey);

// Models
export const CHAT_MODEL = 'gemini-1.5-flash';
export const EMBEDDING_MODEL = 'text-embedding-004';

/**
 * Generate 768-dimensional float embedding vector for a given text
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const cleanText = text.replace(/\n+/g, ' ').trim();
    const result = await model.embedContent(cleanText);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    throw error;
  }
}

/**
 * System prompt enforcing strict citations and hallucination guardrails
 */
export const RAG_SYSTEM_PROMPT = `You are a certified senior Malaysian Tax Consultant Assistant for YYC taxPOD.
Your objective is to provide precise, professional, and factually grounded tax answers based ONLY on the provided Malaysian tax document excerpts.

STRICT INSTRUCTIONS:
1. CITATION REQUIREMENT: For EVERY single factual claim, statutory rate, threshold, or date in your answer, you MUST append an inline citation badge in this exact format:
   [Doc: <document_name>, Page: <page_number>, Section: <section_title>]

2. ZERO HALLUCINATION POLICY:
   - Base your response strictly on the retrieved context chunks below.
   - If the answer cannot be determined or found within the provided context, you MUST explicitly state:
     "The provided official Malaysian tax documents do not contain information regarding this inquiry."
   - DO NOT speculate, assume, or pull unverified knowledge from external sources.

3. TONE & CURRENCY:
   - Use clear Malaysian professional business English.
   - Reference monetary amounts in Malaysian Ringgit (RM / MYR).
`;
