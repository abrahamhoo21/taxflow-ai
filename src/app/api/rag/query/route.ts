import { NextResponse } from 'next/server';
import { TaxRAGService } from '@/services/rag.service';

/**
 * Tax RAG Query API Controller (Thin Controller Layer)
 * Validates incoming tax question and delegates to TaxRAGService.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, top_k, similarity_threshold } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question string is mandatory' }, { status: 400 });
    }

    const response = await TaxRAGService.queryTaxLaws(question, top_k, similarity_threshold);
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('RAG query controller error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
