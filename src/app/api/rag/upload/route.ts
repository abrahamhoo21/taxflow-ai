import { NextResponse } from 'next/server';
import { TaxRAGService } from '@/services/rag.service';
import { ERROR_CODES, createErrorResponse } from '@/constants/errors';

/**
 * POST /api/rag/upload
 * Accepts multipart/form-data containing a statutory PDF document,
 * parses pages, calculates 768-dim embeddings, and ingests into Supabase pgvector.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_NO_FILE, undefined, 400);
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_INVALID_FILE_TYPE, undefined, 400);
    }

    // Convert Web File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_FAILED, 'Uploaded file is empty (0 bytes).', 400);
    }

    const result = await TaxRAGService.ingestPdfBuffer(buffer, file.name);

    return NextResponse.json({
      success: true,
      message: `Successfully processed and ingested ${result.docName} into Supabase pgvector.`,
      document: result,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error processing PDF upload:', errorMsg);
    return createErrorResponse(ERROR_CODES.RAG_UPLOAD_FAILED, errorMsg, 500);
  }
}
