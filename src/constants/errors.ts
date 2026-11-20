import { NextResponse } from 'next/server';

/**
 * Centralized API & System Error Codes and Messages.
 * Enforces the "Zero Hardcoding" rule defined in AGENTS.md.
 */

export const ERROR_CODES = {
  // General HTTP Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  // CRM - Leads
  LEAD_MISSING_ID: 'LEAD_MISSING_ID',
  LEAD_MISSING_FIELDS: 'LEAD_MISSING_FIELDS',
  LEAD_FETCH_FAILED: 'LEAD_FETCH_FAILED',
  LEAD_CREATE_FAILED: 'LEAD_CREATE_FAILED',
  LEAD_UPDATE_FAILED: 'LEAD_UPDATE_FAILED',
  LEAD_DELETE_FAILED: 'LEAD_DELETE_FAILED',

  // CRM - Opportunities
  OPPORTUNITY_MISSING_FIELDS: 'OPPORTUNITY_MISSING_FIELDS',
  OPPORTUNITY_FETCH_FAILED: 'OPPORTUNITY_FETCH_FAILED',
  OPPORTUNITY_CREATE_FAILED: 'OPPORTUNITY_CREATE_FAILED',
  OPPORTUNITY_UPDATE_FAILED: 'OPPORTUNITY_UPDATE_FAILED',

  // AI & RAG
  RAG_MISSING_QUESTION: 'RAG_MISSING_QUESTION',
  RAG_QUERY_FAILED: 'RAG_QUERY_FAILED',
  NOTES_MISSING_RAW_TEXT: 'NOTES_MISSING_RAW_TEXT',
  NOTES_EXTRACTION_FAILED: 'NOTES_EXTRACTION_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.BAD_REQUEST]: 'Invalid request payload or parameters.',
  [ERROR_CODES.UNAUTHORIZED]: 'Unauthorized access.',
  [ERROR_CODES.NOT_FOUND]: 'Requested resource not found.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'An unexpected internal server error occurred.',

  // Leads
  [ERROR_CODES.LEAD_MISSING_ID]: 'Missing mandatory lead identifier (id).',
  [ERROR_CODES.LEAD_MISSING_FIELDS]: 'Missing mandatory contact fields: name, email, phone, and company.',
  [ERROR_CODES.LEAD_FETCH_FAILED]: 'Failed to retrieve leads from database.',
  [ERROR_CODES.LEAD_CREATE_FAILED]: 'Failed to create new lead.',
  [ERROR_CODES.LEAD_UPDATE_FAILED]: 'Failed to update lead details.',
  [ERROR_CODES.LEAD_DELETE_FAILED]: 'Failed to delete lead.',

  // Opportunities
  [ERROR_CODES.OPPORTUNITY_MISSING_FIELDS]: 'Missing mandatory opportunity fields: lead_id, title, or stage.',
  [ERROR_CODES.OPPORTUNITY_FETCH_FAILED]: 'Failed to retrieve opportunities.',
  [ERROR_CODES.OPPORTUNITY_CREATE_FAILED]: 'Failed to create new opportunity.',
  [ERROR_CODES.OPPORTUNITY_UPDATE_FAILED]: 'Failed to update opportunity stage.',

  // AI & RAG
  [ERROR_CODES.RAG_MISSING_QUESTION]: 'Question text is mandatory for tax law retrieval.',
  [ERROR_CODES.RAG_QUERY_FAILED]: 'Failed to execute tax RAG retrieval.',
  [ERROR_CODES.NOTES_MISSING_RAW_TEXT]: 'Meeting notes text (rawText) is required for extraction.',
  [ERROR_CODES.NOTES_EXTRACTION_FAILED]: 'Failed to extract structured data from meeting notes.',
};

/**
 * Standardized API Error Response Helper
 */
export function createErrorResponse(
  code: ErrorCode,
  overrideMessage?: string,
  status: number = 400
) {
  return NextResponse.json(
    {
      code,
      error: overrideMessage || ERROR_MESSAGES[code],
    },
    { status }
  );
}
