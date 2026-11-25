import { NextResponse } from 'next/server';
import { TaxRAGService } from '@/services/rag.service';
import { ERROR_CODES, createErrorResponse } from '@/constants/errors';

/**
 * GET /api/rag/documents
 * List all documents currently indexed in Supabase pgvector
 */
export async function GET() {
  try {
    const documents = await TaxRAGService.getIngestedDocumentsSummary();
    return NextResponse.json({ documents });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching documents list:', errorMsg);
    return createErrorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, errorMsg, 500);
  }
}

/**
 * DELETE /api/rag/documents
 * Delete a specific document's chunks from pgvector
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { doc_name } = body;

    if (!doc_name || typeof doc_name !== 'string') {
      return createErrorResponse(ERROR_CODES.RAG_MISSING_DOC_NAME, undefined, 400);
    }

    await TaxRAGService.deleteDocument(doc_name);
    return NextResponse.json({
      success: true,
      message: `Document ${doc_name} successfully deleted from vector database.`,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error deleting document:', errorMsg);
    return createErrorResponse(ERROR_CODES.RAG_DELETE_DOC_FAILED, errorMsg, 500);
  }
}
