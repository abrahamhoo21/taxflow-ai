import { NextResponse } from 'next/server';
import { NotesExtractorService } from '@/services/notes.service';
import { ERROR_CODES, createErrorResponse } from '@/constants/errors';

/**
 * Meeting Notes Extractor API Controller (Thin Controller Layer - Option B)
 * Delegates zero-shot information extraction to NotesExtractorService.
 */
export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    if (!rawText || typeof rawText !== 'string') {
      return createErrorResponse(ERROR_CODES.NOTES_MISSING_RAW_TEXT, undefined, 400);
    }

    const extracted = await NotesExtractorService.extractMeetingNotes(rawText);
    return NextResponse.json(extracted);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return createErrorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, errorMsg, 500);
  }
}
