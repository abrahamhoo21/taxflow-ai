# AI Assistance & Co-Development Documentation (`AI_USAGE.md`)
**Project:** YYC taxPOD CRM with AI Capabilities & Tax RAG Assistant  
**Author:** Abraham (Kuala Lumpur, Malaysia)  
**Role:** Software Engineer (Full Stack & AI Integration)  
**Date:** November 2026  

---

## 1. AI Tools Utilized & Scope of Delegation

Throughout the engineering lifecycle of this case study, AI-assisted development tools were leveraged across different architectural and implementation layers:

| Tool | Model / Engine | Primary Area of Utilization |
| :--- | :--- | :--- |
| **Google Antigravity & Senior AI Pair Programmer** | Gemini 3.8 Flash / Pro | System architectural design, schema drafting (`schema.sql`), Mermaid component diagrams, and RAG prompt calibration. |
| **Google AI Studio** | `gemini-1.5-flash` | Production runtime LLM service for RAG context synthesis, citation enforcement, and zero-shot JSON structured output extraction. |
| **Google AI Studio** | `text-embedding-004` | Generating 768-dimensional dense semantic vector representations for Malaysian tax documents and incoming search queries. |
| **TypeScript / Zod** | Static Schema Parser | Validating and constraining AI outputs before allowing state persistence to PostgreSQL. |

---

## 2. In-Depth Co-Development Case Study: A Real-World Prompt & Iteration

### Context:
When implementing **Option B (Meeting Notes Extractor)**, sales reps frequently provide highly disorganized, colloquial Malaysian business meeting notes (mixing English, Malay, and local slang). A naive prompt was producing unstructured summaries that could not be reliably parsed into database models.

### 2.1 The Actual Prompt Given to the AI:
```text
You are an expert sales operations AI assistant for YYC taxPOD Malaysia.
Your task is to analyze raw meeting notes, sales WhatsApp transcripts, or phone call summaries, 
and extract structured business intelligence for our CRM.

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

Do not guess details not mentioned; leave phone/email null if omitted. 
Default stage to 'Qualified' if budget is agreed.
```

### 2.2 Raw Output Received from the AI:
```json
{
  "contactName": "Mr. Wong",
  "companyName": "Berjaya Food",
  "phone": "012-9876543",
  "email": "wong@berjaya.com",
  "opportunityTitle": "SST 8% Compliance Review",
  "dealValueRM": "RM 35,000",
  "stage": "Qualified",
  "actionItems": [
    "Send formal proposal by this Friday"
  ],
  "summary": "Met with Mr. Wong from Berjaya Food regarding SST 8% compliance review for 15 branches."
}
```

### 2.3 What I Changed & Why (Engineering Critical Thinking):
1. **Discrepancy Detected**: The AI formatted `"dealValueRM": "RM 35,000"` as a **string** containing the currency symbol `"RM"` and a comma, even though the schema requested a numeric type (`number`).
2. **Impact on System**: If passed directly to the database or TypeScript calculation engines (`reduce` for pipeline totals), this caused a runtime `NaN` error in financial aggregations.
3. **Engineering Solution Applied**:
   - Updated the Gemini generation configuration to strictly enforce `responseMimeType: "application/json"`.
   - Built a defensive sanitizer on the server controller (`src/app/api/ai/extract-notes/route.ts`):
     ```typescript
     dealValueRM: parseFloat(String(data.dealValueRM).replace(/[^0-9.]/g, '')) || 0
     ```
   - Implemented a **Human-in-the-Loop (HITL) Review Modal** (`NotesExtractorModal.tsx`): Before any extracted data hits PostgreSQL, the sales rep is presented with an editable card to review, adjust the deal value, and click **[Confirm & Save]**.

---

## 3. Candid Reflection: Where AI Helped Most vs. Where It Fell Short

### 🚀 Where AI Helped Most:
1. **Accelerated Ingestion & Vector Pipeline**:
   - Synthesizing 5 authoritative Malaysian tax statutory documents into clean, tagged semantic chunks and configuring PostgreSQL `pgvector` HNSW index scripts took minutes instead of days.
2. **Eliminating Boilerplate in Full-Stack TypeScript**:
   - Generating standard CRUD API route handlers and corresponding React hooks with full type definitions allowed focus on business logic and UI polish.
3. **Drafting Complex Architecture Visuals**:
   - Mermaid.js diagrams for system tiers and data models were generated with high structural fidelity, rendering natively in Markdown.

### ⚠️ Where AI Fell Short & Required Human Engineering Intervention:
1. **Hallucination on Tax Specifics**:
   - In preliminary RAG prompts without strict negative constraints, the LLM attempted to extrapolate Malaysian e-invoice deadlines for foreign jurisdictions (e.g., claiming Singapore had the same phase rollout). 
   - *Fix:* Engineered a strict **Hallucination Guardrail** in `src/lib/gemini.ts` that forces the model to reply *"The provided official Malaysian tax documents do not contain information regarding this inquiry"* whenever vector similarity scores drop below threshold.
2. **Layout & UI Responsiveness**:
   - AI-generated UI code often struggled with vertical Kanban scrolling and nested modal z-indexes. Manual CSS fine-tuning and Flexbox architecture were required to achieve the sleek, Linear-grade look.
3. **Database Consistency**:
   - AI code initially omitted foreign key `ON DELETE CASCADE` and UUID defaults, which would cause orphaned records in production. Manual DDL auditing ensured relational integrity.
