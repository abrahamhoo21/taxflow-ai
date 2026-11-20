import { genAI, CHAT_MODEL, getEmbedding, RAG_SYSTEM_PROMPT } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { Citation, RAGQueryResponse } from '@/types/rag';
import { RAG_DEFAULTS } from '@/constants/crm';

/**
 * Tax RAG Domain Service - Clean Architecture Application Layer
 * Encapsulates Vector Retrieval, Context Assembly, Citation Tagging, and Hallucination Guardrails.
 */
export class TaxRAGService {
  /**
   * Execute full RAG pipeline for a Malaysian tax inquiry
   */
  static async queryTaxLaws(
    question: string,
    topK: number = RAG_DEFAULTS.TOP_K_CHUNKS,
    threshold: number = RAG_DEFAULTS.SIMILARITY_THRESHOLD
  ): Promise<RAGQueryResponse> {
    // 1. Generate Query Vector via Google text-embedding-004
    const queryVector = await getEmbedding(question);

    // 2. Perform Top-K Cosine Similarity Search on Supabase pgvector
    const { data: matchedChunks, error: rpcError } = await supabaseAdmin.rpc('match_tax_chunks', {
      query_embedding: queryVector,
      match_threshold: threshold,
      match_count: topK,
    });

    if (rpcError) {
      throw new Error(`Vector retrieval RPC failed: ${rpcError.message}`);
    }

    // 3. Strict Hallucination Guardrail: Refuse when no chunks meet similarity threshold
    if (!matchedChunks || matchedChunks.length === 0) {
      return {
        answer: "The provided official Malaysian tax documents do not contain information regarding this inquiry. (Hallucination Guardrail: Question outside ingested knowledge base).",
        citations: [],
        retrieved_chunks_count: 0,
        is_grounded: true,
        hallucination_warning: true,
      };
    }

    // 4. Assemble Verified Source Citations
    const citations: Citation[] = matchedChunks.map((chunk: {
      doc_name: string;
      page_number: number;
      section_title: string;
      chunk_content: string;
    }) => ({
      doc_name: chunk.doc_name,
      page_number: chunk.page_number,
      section_title: chunk.section_title,
      snippet: chunk.chunk_content.substring(0, 150) + '...',
    }));

    // 5. Build Grounded Context Block
    const contextText = matchedChunks
      .map((c: { doc_name: string; page_number: number; section_title: string; chunk_content: string }, idx: number) => 
        `--- EXCERPT ${idx + 1} [Document: ${c.doc_name}, Page: ${c.page_number}, Section: ${c.section_title || 'N/A'}] ---\n${c.chunk_content}`
      )
      .join('\n\n');

    // 6. Synthesize Response with Citations via Gemini Flash
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      systemInstruction: RAG_SYSTEM_PROMPT,
    });

    const prompt = `QUESTION:
${question}

CONTEXT FROM OFFICIAL MALAYSIAN TAX DOCUMENTS:
${contextText}

Generate a concise, authoritative answer for our YYC tax consultant team. Remember to cite [Doc: ..., Page: ..., Section: ...] after every claim.`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return {
      answer,
      citations,
      retrieved_chunks_count: matchedChunks.length,
      is_grounded: true,
    };
  }
}
