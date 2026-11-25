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
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

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

    const result = await TaxRAGService.ingestPdfBuffer(buffer, file.name, { force });

    return NextResponse.json({
      success: true,
      message: result.message || `Successfully processed and ingested ${result.docName} into Supabase pgvector.`,
      document: result,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error processing PDF upload:', errorMsg);

    if (errorMsg.includes('Duplicate document detected')) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_DUPLICATE_CONTENT, errorMsg, 409);
    }
    if (errorMsg.includes('exceeds maximum allowed limit')) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_FILE_TOO_LARGE, errorMsg, 413);
    }
    if (errorMsg.includes('Corrupt or invalid PDF file header')) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_CORRUPT_PDF, errorMsg, 400);
    }
    if (errorMsg.includes('no readable digital text')) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_NO_TEXT, errorMsg, 422);
    }
    if (errorMsg.includes('Malaysian tax, statutory, or financial')) {
      return createErrorResponse(ERROR_CODES.RAG_UPLOAD_IRRELEVANT_DOMAIN, errorMsg, 422);
    }

    return createErrorResponse(ERROR_CODES.RAG_UPLOAD_FAILED, errorMsg, 500);
  }
}
