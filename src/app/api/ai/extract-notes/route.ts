import { NextResponse } from 'next/server';
import { NotesExtractorService } from '@/services/notes.service';

/**
 * Meeting Notes Extractor API Controller (Thin Controller Layer - Option B)
 * Delegates zero-shot information extraction to NotesExtractorService.
 */
export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid rawText field' }, { status: 400 });
    }

    const extracted = await NotesExtractorService.extractMeetingNotes(rawText);
    return NextResponse.json(extracted);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
