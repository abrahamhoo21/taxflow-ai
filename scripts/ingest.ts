import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import * as fs from 'fs';
import * as path from 'path';
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
 * Smart Chunker: Parses text preserving page tags and section headers
 */
function parseAndChunkDocument(fileName: string, rawText: string): ChunkMeta[] {
  const chunks: ChunkMeta[] = [];
  const lines = rawText.split('\n');

  let currentPage = 1;
  let currentSection = 'General Overview';
  let buffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect Page marker e.g. [Page 6]
    const pageMatch = trimmed.match(/\[Page\s+(\d+)\]/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
    }

    // Detect Section marker e.g. ### Section 1: or #### 1.4
    if (trimmed.startsWith('#')) {
      if (buffer.length > 0) {
        const textBlock = buffer.join('\n').trim();
        if (textBlock.length > 80) {
          chunks.push({
            docName: fileName,
            pageNumber: currentPage,
            sectionTitle: currentSection,
            content: textBlock,
          });
        }
        buffer = [];
      }
      currentSection = trimmed.replace(/^#+\s*/, '').replace(/\[Page\s+\d+\]\s*/i, '');
    }

    if (trimmed.length > 0) {
      buffer.push(trimmed);
    }

    if (buffer.join(' ').length > 1200) {
      chunks.push({
        docName: fileName,
        pageNumber: currentPage,
        sectionTitle: currentSection,
        content: buffer.join('\n').trim(),
      });
      buffer = buffer.slice(-2);
    }
  }

  if (buffer.length > 0) {
    const textBlock = buffer.join('\n').trim();
    if (textBlock.length > 40) {
      chunks.push({
        docName: fileName,
        pageNumber: currentPage,
        sectionTitle: currentSection,
        content: textBlock,
      });
    }
  }

  return chunks;
}

async function runIngestion() {
  console.log('🚀 Starting Malaysian Tax Documents Ingestion Pipeline...');
  console.log(`📁 Scanning directory: ${KB_DIR}\n`);

  if (!fs.existsSync(KB_DIR)) {
    console.error(`❌ Directory not found: ${KB_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.md') || f.endsWith('.pdf'));
  console.log(`Found ${files.length} official tax documents to ingest:\n${files.map(f => `  • ${f}`).join('\n')}\n`);

  let totalChunksIngested = 0;

  for (const file of files) {
    const filePath = path.join(KB_DIR, file);
    console.log(`⏳ Processing: ${file}...`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = parseAndChunkDocument(file, content);
    console.log(`   Generated ${chunks.length} semantically tagged chunks.`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const embedding = await getEmbedding(chunk.content);

        const { error } = await supabaseAdmin.from('tax_document_chunks').insert({
          doc_name: chunk.docName,
          page_number: chunk.pageNumber,
          section_title: chunk.sectionTitle,
          chunk_content: chunk.content,
          embedding: embedding,
          metadata: {
            source_file: chunk.docName,
            chunk_index: i,
            ingested_at: new Date().toISOString(),
          },
        });

        if (error) {
          console.error(`   ❌ Failed to insert chunk ${i + 1}:`, error.message);
        } else {
          totalChunksIngested++;
        }

        // Small pause to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`   ❌ Error embedding chunk ${i + 1}:`, errorMsg);
      }
    }
    console.log(`   ✅ Finished ${file}.\n`);
  }

  console.log(`🎉 Ingestion complete! Total chunks stored in pgvector: ${totalChunksIngested}`);
}

runIngestion().catch(console.error);
