import { NextResponse } from 'next/server';
import { CRMService } from '@/services/crm.service';
import { ERROR_CODES, createErrorResponse } from '@/constants/errors';

/**
 * Opportunities API Controller (Thin Controller Layer)
 * Handles deals listing, creation, and stage transitions.
 */
export async function GET() {
  try {
    const opportunities = await CRMService.getOpportunities();
    return NextResponse.json(opportunities);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return createErrorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, errorMsg, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lead_id, title, value_rm, stage } = body;

    if (!lead_id || !title) {
      return createErrorResponse(ERROR_CODES.OPPORTUNITY_MISSING_FIELDS, undefined, 400);
    }

    const opportunity = await CRMService.createOpportunity({
      lead_id,
      title,
      value_rm: Number(value_rm) || 0,
      stage,
    });
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return createErrorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, errorMsg, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, stage, value_rm } = body;

    if (!id || !stage) {
      return createErrorResponse(ERROR_CODES.OPPORTUNITY_MISSING_FIELDS, undefined, 400);
    }

    const updated = await CRMService.updateOpportunityStage(
      id,
      stage,
      value_rm !== undefined ? Number(value_rm) : undefined
    );
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return createErrorResponse(ERROR_CODES.INTERNAL_SERVER_ERROR, errorMsg, 500);
  }
}
