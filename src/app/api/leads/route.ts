import { NextResponse } from 'next/server';
import { CRMService } from '@/services/crm.service';

/**
 * Leads API Controller (Thin Controller Layer)
 * Validates HTTP inputs and delegates business logic to CRMService.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const leads = await CRMService.getLeads(search, status);
    return NextResponse.json(leads);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, status } = body;

    if (!name || !email || !phone || !company) {
      return NextResponse.json({ error: 'Missing mandatory fields: name, email, phone, company' }, { status: 400 });
    }

    const newLead = await CRMService.createLead({ name, email, phone, company, status });
    return NextResponse.json(newLead, { status: 201 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });

    await CRMService.deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
