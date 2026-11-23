import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import { getEmbedding } from '../src/lib/gemini';
import { supabaseAdmin } from '../src/lib/supabase';

interface ChunkMeta {
  docName: string;
  pageNumber: number;
  sectionTitle: string;
  content: string;
}

const KB_DIR = path.join(process.cwd(), 'knowledge-base');

/**
 * Extract clean pages from a PDF file preserving exact page index
 */
async function extractPagesFromPdf(filePath: string): Promise<{ pageNumber: number; text: string }[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const pages: { pageNumber: number; text: string }[] = [];

  const options = {
    pagerender: async function (pageData: any) {
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

  await pdf(dataBuffer, options);
  pages.sort((a, b) => a.pageNumber - b.pageNumber);
  return pages;
}

/**
 * Extract an informative section heading from a page's content
 */
function detectSectionTitle(lines: string[], defaultTitle: string): string {
  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines like "1.4 Phased Implementation Schedule" or "PART I - GIFTS"
    if (/^(\d+(\.\d+)*\s+[A-Z]|PART\s+[IVX]+|SECTION\s+\d+|SCHEDULE\s+\d+|PUBLIC RULING)/i.test(trimmed)) {
      return trimmed.substring(0, 80);
    }
  }
  return defaultTitle;
}

/**
 * Break extracted pages into semantically cohesive, token-bounded chunks
 */
function chunkPdfPages(fileName: string, pages: { pageNumber: number; text: string }[]): ChunkMeta[] {
  const chunks: ChunkMeta[] = [];
  let currentSection = fileName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

  for (const page of pages) {
    if (!page.text || page.text.length < 50) continue;

    const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
    currentSection = detectSectionTitle(lines, currentSection);

    // If page is short to medium size, keep as single cohesive chunk
    if (page.text.length <= 1400) {
      chunks.push({
        docName: fileName,
        pageNumber: page.pageNumber,
        sectionTitle: currentSection,
        content: page.text,
      });
    } else {
      // Split large page into 2 overlapping sub-chunks
      const midpoint = Math.floor(page.text.length / 2);
      const splitIndex = page.text.indexOf('\n', midpoint);
      const safeSplit = splitIndex > 0 ? splitIndex : midpoint;

      const part1 = page.text.substring(0, safeSplit).trim();
      const part2 = page.text.substring(Math.max(0, safeSplit - 150)).trim();

      if (part1.length > 50) {
        chunks.push({
          docName: fileName,
          pageNumber: page.pageNumber,
          sectionTitle: currentSection,
          content: part1,
        });
      }
      if (part2.length > 50) {
        chunks.push({
          docName: fileName,
          pageNumber: page.pageNumber,
          sectionTitle: currentSection,
          content: part2,
        });
      }
    }
  }

  return chunks;
}

async function runIngestion() {
  console.log('🚀 Starting Malaysian Tax Documents Ingestion Pipeline (100% Real PDF Source)...');
  console.log(`📁 Scanning directory: ${KB_DIR}\n`);

  if (!fs.existsSync(KB_DIR)) {
    console.error(`❌ Directory not found: ${KB_DIR}`);
    process.exit(1);
  }

  const pdfFiles = fs.readdirSync(KB_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Found ${pdfFiles.length} official tax PDF documents to ingest:\n${pdfFiles.map(f => `  • ${f}`).join('\n')}\n`);

  if (pdfFiles.length === 0) {
    console.error('❌ No PDF files found in knowledge-base directory!');
    process.exit(1);
  }

  // 1. Purge old vector entries
  console.log('🧹 Purging old chunks from Supabase tax_document_chunks...');
  const { error: purgeError } = await supabaseAdmin
    .from('tax_document_chunks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (purgeError) {
    console.warn(`   ⚠️ Purge warning: ${purgeError.message}`);
  } else {
    console.log('   ✅ Previous chunks cleared successfully.\n');
  }

  let totalChunksIngested = 0;

  for (const file of pdfFiles) {
    const filePath = path.join(KB_DIR, file);
    console.log(`⏳ Parsing PDF pages: ${file}...`);

    const pages = await extractPagesFromPdf(filePath);
    const chunks = chunkPdfPages(file, pages);
    console.log(`   Generated ${chunks.length} semantically tagged chunks across ${pages.length} pages.`);

    console.log(`   Embedding and writing to Supabase pgvector...`);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const embedding = await getEmbedding(chunk.content);

        const { error: insertError } = await supabaseAdmin.from('tax_document_chunks').insert({
          doc_name: chunk.docName,
          page_number: chunk.pageNumber,
          section_title: chunk.sectionTitle,
          chunk_content: chunk.content,
          embedding: embedding,
          metadata: {
            source_file: chunk.docName,
            page_number: chunk.pageNumber,
            chunk_index: i,
            total_chunks: chunks.length,
            ingested_at: new Date().toISOString(),
          },
        });

        if (insertError) {
          console.error(`   ❌ Failed to insert chunk ${i + 1}/${chunks.length}:`, insertError.message);
        } else {
          totalChunksIngested++;
        }

        // Brief delay between calls to respect Gemini API rate limits
        await new Promise(resolve => setTimeout(resolve, 80));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`   ❌ Error embedding chunk ${i + 1}/${chunks.length}:`, errorMsg);
        // Wait a little longer on error before continuing
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`   ✅ Finished ${file} (${chunks.length} chunks).\n`);
  }

  console.log(`🎉 Ingestion complete! Total chunks stored in pgvector: ${totalChunksIngested}`);
}

runIngestion().catch(console.error);
