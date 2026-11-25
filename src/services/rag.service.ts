import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import pdf from 'pdf-parse';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODEL, getEmbedding, RAG_SYSTEM_PROMPT } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';
import { Citation, RAGQueryResponse } from '@/types/rag';
import { RAG_DEFAULTS } from '@/constants/crm';
import { getOfficialDocUrl, RAG_INGESTION_CONFIG } from '@/constants/tax';

export interface DocumentSummary {
  doc_name: string;
  chunks_count: number;
  total_pages: number;
  last_ingested_at: string;
}

/**
 * Tax RAG Domain Service - Clean Architecture Application Layer
 * Encapsulates Vector Retrieval, Context Assembly, Citation Tagging, Ingestion, and Hallucination Guardrails.
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
      view_url: `/api/rag/documents/view/${encodeURIComponent(chunk.doc_name)}#page=${chunk.page_number}`,
      official_url: getOfficialDocUrl(chunk.doc_name),
    }));

    // 5. Build Grounded Context Block
    const contextText = matchedChunks
      .map((c: { doc_name: string; page_number: number; section_title: string; chunk_content: string }, idx: number) => 
        `--- EXCERPT ${idx + 1} [Document: ${c.doc_name}, Page: ${c.page_number}, Section: ${c.section_title || 'N/A'}] ---\n${c.chunk_content}`
      )
      .join('\n\n');

    // 6. Synthesize Response with Citations via Gemini Flash (with Fallback)
    const prompt = `QUESTION:
${question}

CONTEXT FROM OFFICIAL MALAYSIAN TAX DOCUMENTS:
${contextText}

Generate a concise, authoritative answer for our YYC tax consultant team. Remember to cite [Doc: ..., Page: ..., Section: ...] after every claim.`;

    let answer = '';
    try {
      const model = genAI.getGenerativeModel({
        model: CHAT_MODEL,
        systemInstruction: RAG_SYSTEM_PROMPT,
      });
      const result = await model.generateContent(prompt);
      answer = result.response.text();
    } catch {
      // Fallback model if primary encounters transient load spike
      const fallbackModel = genAI.getGenerativeModel({
        model: FALLBACK_CHAT_MODEL,
        systemInstruction: RAG_SYSTEM_PROMPT,
      });
      const result = await fallbackModel.generateContent(prompt);
      answer = result.response.text();
    }

    return {
      answer,
      citations,
      retrieved_chunks_count: matchedChunks.length,
      is_grounded: true,
    };
  }

  /**
   * Get summary of all documents currently ingested in Supabase pgvector
   */
  static async getIngestedDocumentsSummary(): Promise<DocumentSummary[]> {
    const { data, error } = await supabaseAdmin
      .from('tax_document_chunks')
      .select('doc_name, page_number, created_at, metadata');

    if (error) {
      throw new Error(`Failed to retrieve ingested documents: ${error.message}`);
    }

    const docMap = new Map<string, { count: number; maxPage: number; latestDate: string }>();

    for (const row of data || []) {
      const doc = row.doc_name;
      const page = row.page_number || 1;
      const date = row.created_at || new Date().toISOString();

      if (!docMap.has(doc)) {
        docMap.set(doc, { count: 1, maxPage: page, latestDate: date });
      } else {
        const item = docMap.get(doc)!;
        item.count++;
        if (page > item.maxPage) item.maxPage = page;
        if (date > item.latestDate) item.latestDate = date;
      }
    }

    return Array.from(docMap.entries()).map(([doc_name, info]) => ({
      doc_name,
      chunks_count: info.count,
      total_pages: info.maxPage,
      last_ingested_at: info.latestDate,
    }));
  }

  /**
   * Ingest an uploaded PDF buffer into Supabase pgvector with full validation & duplicate prevention.
   */
  static async ingestPdfBuffer(
    buffer: Buffer,
    originalFileName: string,
    options?: { force?: boolean }
  ): Promise<{
    docName: string;
    chunksCount: number;
    pagesCount: number;
    fileHash: string;
    fileSizeBytes: number;
    isDuplicate?: boolean;
    message?: string;
  }> {
    const cleanFileName = path.basename(originalFileName).replace(/[^a-zA-Z0-9._-]/g, '_');

    // 1. Validation: Magic Bytes Check (%PDF-)
    const fileHeader = buffer.subarray(0, 5).toString('ascii');
    if (!fileHeader.startsWith(RAG_INGESTION_CONFIG.PDF_MAGIC_BYTES)) {
      throw new Error(
        `Corrupt or invalid PDF file header. Expected "%PDF-", but received "${fileHeader.replace(/[^\x20-\x7E]/g, '?')}". Only genuine PDF documents are accepted.`
      );
    }

    // 2. Validation: Maximum Size Limit (30MB)
    if (buffer.length > RAG_INGESTION_CONFIG.MAX_FILE_SIZE_BYTES) {
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1);
      throw new Error(
        `File size (${sizeMB} MB) exceeds maximum allowed limit of ${(RAG_INGESTION_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB.`
      );
    }

    // 3. Validation: SHA-256 Content Fingerprint & Duplicate Prevention
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Query existing chunks to see if this exact content was already uploaded
    const { data: existingRecords } = await supabaseAdmin
      .from('tax_document_chunks')
      .select('doc_name, metadata')
      .filter('metadata->>file_hash', 'eq', fileHash)
      .limit(1);

    if (existingRecords && existingRecords.length > 0) {
      const existingDoc = existingRecords[0].doc_name;
      if (existingDoc !== cleanFileName) {
        // Different filename, but 100% duplicate file contents!
        throw new Error(
          `Duplicate document detected: The contents of "${cleanFileName}" are 100% identical to already ingested document "${existingDoc}" (SHA-256: ${fileHash.substring(0, 10)}...). Upload rejected to prevent duplicate vector entries.`
        );
      } else if (!options?.force) {
        // Identical file name and identical hash, and user did not force re-index
        return {
          docName: cleanFileName,
          chunksCount: 0,
          pagesCount: 0,
          fileHash,
          fileSizeBytes: buffer.length,
          isDuplicate: true,
          message: `Document "${cleanFileName}" is already indexed with identical content (SHA-256: ${fileHash.substring(0, 8)}...). Re-indexing skipped to conserve API quota. Use "Force re-index" to override.`,
        };
      }
    }

    // 4. Extract pages using pdf-parse with custom page renderer
    const pages: { pageNumber: number; text: string }[] = [];
    const parseOptions = {
      pagerender: async function (pageData: { pageIndex: number; getTextContent: () => Promise<{ items: Array<{ transform: number[]; str: string }> }> }) {
        const textContent = await pageData.getTextContent();
        let lastY: number | undefined;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === undefined) {
            text += ' ' + item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          text: text.trim(),
        });
        return text;
      },
    };

    await pdf(buffer, parseOptions);
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    // 5. Validation: Zero-Text / Scanned Physical Image Guard
    const totalExtractedText = pages.map(p => p.text).join(' ').trim();
    if (pages.length === 0 || totalExtractedText.length < RAG_INGESTION_CONFIG.MIN_DOCUMENT_TEXT_LENGTH) {
      throw new Error(
        'PDF contains no readable digital text (scanned physical image or empty pages without OCR). The RAG assistant requires text-searchable PDFs to generate embeddings.'
      );
    }

    // 6. Validation: Tax & Statutory Domain Relevance Guard (Wrong Doc Prevention)
    const lowerText = totalExtractedText.toLowerCase();
    const hasTaxDomainKeywords = RAG_INGESTION_CONFIG.TAX_DOMAIN_KEYWORDS.some(kw => lowerText.includes(kw));
    if (!hasTaxDomainKeywords) {
      throw new Error(
        'The uploaded document does not appear to contain Malaysian tax, statutory, or financial regulatory content. Please ensure you are uploading official tax guidelines, public rulings, or legal acts.'
      );
    }

    // 7. Chunk the pages
    const chunks: { pageNumber: number; sectionTitle: string; content: string }[] = [];
    let currentSection = cleanFileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    for (const page of pages) {
      if (!page.text || page.text.length < 50) continue;

      const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (/^(\d+(\.\d+)*\s+[A-Z]|PART\s+[IVX]+|SECTION\s+\d+|SCHEDULE\s+\d+|PUBLIC RULING)/i.test(line)) {
          currentSection = line.substring(0, 80);
          break;
        }
      }

      if (page.text.length <= 1400) {
        chunks.push({
          pageNumber: page.pageNumber,
          sectionTitle: currentSection,
          content: page.text,
        });
      } else {
        const midpoint = Math.floor(page.text.length / 2);
        const splitIndex = page.text.indexOf('\n', midpoint);
        const safeSplit = splitIndex > 0 ? splitIndex : midpoint;

        const part1 = page.text.substring(0, safeSplit).trim();
        const part2 = page.text.substring(Math.max(0, safeSplit - 150)).trim();

        if (part1.length > 50) {
          chunks.push({ pageNumber: page.pageNumber, sectionTitle: currentSection, content: part1 });
        }
        if (part2.length > 50) {
          chunks.push({ pageNumber: page.pageNumber, sectionTitle: currentSection, content: part2 });
        }
      }
    }

    if (chunks.length === 0) {
      throw new Error('No semantically meaningful text chunks could be generated from this document.');
    }

    // 8. Persist verified copy to knowledge-base directory
    const kbDir = path.join(process.cwd(), 'knowledge-base');
    if (!fs.existsSync(kbDir)) {
      fs.mkdirSync(kbDir, { recursive: true });
    }
    fs.writeFileSync(path.join(kbDir, cleanFileName), buffer);

    // 9. Atomic overwrite: Remove existing chunks for this specific document
    await supabaseAdmin
      .from('tax_document_chunks')
      .delete()
      .eq('doc_name', cleanFileName);

    // 10. Generate Embeddings & Save to Supabase pgvector with full metadata
    let inserted = 0;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const embedding = await getEmbedding(c.content);
      const { error: insErr } = await supabaseAdmin.from('tax_document_chunks').insert({
        doc_name: cleanFileName,
        page_number: c.pageNumber,
        section_title: c.sectionTitle,
        chunk_content: c.content,
        embedding,
        metadata: {
          source_file: cleanFileName,
          page_number: c.pageNumber,
          chunk_index: i,
          total_chunks: chunks.length,
          file_hash: fileHash,
          file_size_bytes: buffer.length,
          ingested_at: new Date().toISOString(),
        },
      });

      if (!insErr) {
        inserted++;
      }

      // Small throttle to avoid load spikes
      if (i % 4 === 0) {
        await new Promise(r => setTimeout(r, 60));
      }
    }

    return {
      docName: cleanFileName,
      chunksCount: inserted,
      pagesCount: pages.length,
      fileHash,
      fileSizeBytes: buffer.length,
    };
  }

  /**
   * Delete all chunks for a document from Supabase pgvector
   */
  static async deleteDocument(docName: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('tax_document_chunks')
      .delete()
      .eq('doc_name', docName);

    if (error) {
      throw new Error(`Failed to delete document chunks: ${error.message}`);
    }

    // Remove local file if present
    const filePath = path.join(process.cwd(), 'knowledge-base', docName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore filesystem delete failures
      }
    }
  }
}
