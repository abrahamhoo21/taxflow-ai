import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/rag/documents/view/[filename]
 * Serves statutory PDF files with clean .pdf path for reliable browser #page=N deep-linking.
 */
export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const rawFilename = params.filename;
    const cleanName = path.basename(decodeURIComponent(rawFilename));
    const filePath = path.join(process.cwd(), 'knowledge-base', cleanName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse(`Document "${cleanName}" not found in knowledge-base repository.`, {
        status: 404,
      });
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
