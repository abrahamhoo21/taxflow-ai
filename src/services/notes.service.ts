import { genAI, CHAT_MODEL } from '@/lib/gemini';
import { ExtractedNotes } from '@/types/rag';

/**
 * Notes Extractor Domain Service - Clean Architecture Application Layer (Option B)
 * Extracts structured CRM entities from unstructured notes with Schema Enforcement.
 */
export class NotesExtractorService {
  static async extractMeetingNotes(rawText: string): Promise<ExtractedNotes> {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
      },
      systemInstruction: `You are an expert sales operations AI assistant for YYC taxPOD Malaysia.
Analyze raw meeting notes, sales WhatsApp chats, or phone call summaries, and extract structured business intelligence for our CRM.

Extract the following JSON schema:
{
  "contactName": "string (Full name or title of the prospect, e.g. Mr. Wong)",
  "companyName": "string (Company name mentioned, e.g. Berjaya Food Sdn Bhd)",
  "phone": "string or null (Malaysian phone format)",
  "email": "string or null",
  "opportunityTitle": "string (Brief deal package name, e.g. SST 8% Compliance Advisory)",
  "dealValueRM": "number (Numeric amount in Malaysian Ringgit, e.g. 35000)",
  "stage": "string ('New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won')",
  "actionItems": ["string (Follow-up tasks with deadlines)"],
  "summary": "string (One sentence summary)"
}

Do not guess details not mentioned; leave phone/email null if omitted. Default stage to 'Qualified' if budget is agreed.`,
    });

    const result = await model.generateContent(`Extract CRM data from these meeting notes:\n\n${rawText}`);
    const jsonText = result.response.text();
    const parsedData: ExtractedNotes = JSON.parse(jsonText);

    // Defensive Sanitization: Ensure dealValueRM is strictly numeric
    if (parsedData.dealValueRM) {
      parsedData.dealValueRM = parseFloat(String(parsedData.dealValueRM).replace(/[^0-9.]/g, '')) || 0;
    }

    return parsedData;
  }
}
