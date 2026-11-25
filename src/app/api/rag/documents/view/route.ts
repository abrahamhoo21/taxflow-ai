import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/rag/documents/view?doc=filename.pdf
 * Streams official PDF document to the browser for inline viewing.
 * Supports #page=N browser deep linking directly to cited pages.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docName = searchParams.get('doc');

    if (!docName || typeof docName !== 'string') {
      return new NextResponse('Missing required "doc" query parameter.', { status: 400 });
    }

    const cleanName = path.basename(docName);
    const filePath = path.join(process.cwd(), 'knowledge-base', cleanName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse(`Document "${cleanName}" not found in knowledge-base repository.`, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${cleanName}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error serving PDF document:', errorMsg);
    return new NextResponse('Internal error streaming document.', { status: 500 });
  }
}
