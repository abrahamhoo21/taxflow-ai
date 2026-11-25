# YYC taxPOD CRM & Tax AI Assistant
> Production-grade Lightweight CRM with RAG-Powered Malaysian Tax Intelligence  
> Built for the **YYC taxPOD Software Engineer (Full Stack & AI Integration)** Technical Assessment.

---

## 🚀 Key Features

### Part 1: Core CRM Modules
- **Leads & Contacts**: Full CRUD with instant search and status filtering (`Lead`, `Prospect`, `Customer`).
- **Opportunity Pipeline (Kanban Board)**: Drag-and-drop opportunity cards across 5 stages (`New` ➔ `Contacted` ➔ `Qualified` ➔ `Proposal` ➔ `Won/Lost`). Automated real-time pipeline valuation in **Malaysian Ringgit (RM)**.
- **Executive Dashboard**: Real-time KPI summary (Total Contacts, Open Deals, Total Pipeline Value RM, Won Contracts) + Chronological activity timeline.

### Part 2: Mandatory AI Integration (RAG)
- **100% Real Statutory Knowledge Base**: Ingested 5 authoritative Malaysian tax documents (IRBM e-Invoice Guidelines, LHDN e-Invoice General FAQs, Public Ruling 4/2026 Small Value Assets, Public Ruling 5/2026 Resident Individual Deductions, and Public Ruling 3/2026 Bilateral & Unilateral Tax Relief).
- **Sub-millisecond Retrieval**: Chunked and embedded with Google `text-embedding-004` (768 dimensions), stored in **Supabase PostgreSQL with pgvector (HNSW Index)**.
- **Accurate Citations & Interactive In-App PDF Deep-Linking**:
  - Answers cite exact document name, page number, and statutory section: `[Doc: ..., Page: ..., Section: ...]`.
  - **In-App Modal Viewer**: Click `Open PDF (Page X)` to launch an embedded viewer auto-scrolled to the cited page (`#page=N`).
  - **Official LHDN Portal**: One-click direct link to official government publications on `hasil.gov.my`.
- **Hallucination Guard**: Questions outside the knowledge base trigger a grounded refusal rather than speculation.
- **Evaluation Benchmark**: Automated 10-query test suite reporting retrieval hit rates (`npm run eval`).

### Part 3: Knowledge Base Management & Non-Tech Ingestion (`/knowledge`)
- **Non-Technical UI Upload**: Drag-and-drop official PDFs directly from the browser without running manual CLI scripts.
- **5-Layer Enterprise Validation & Duplicate Prevention**:
  1. *Magic Bytes Header*: Validates `%PDF-` header to reject disguised `.exe`, `.docx`, or corrupted files.
  2. *File Size Limits*: Enforces maximum 30MB limit to prevent server memory exhaustion.
  3. *SHA-256 Content Fingerprint*: Detects duplicate content under different filenames to save embedding tokens.
  4. *Zero-Text / Scanned Guard*: Rejects image-only/scanned physical PDFs that lack OCR text.
  5. *Domain Relevance Guard*: Filters out non-tax/irrelevant uploads (recipes, resumes, contracts).
- **Atomic Updates**: Replacing or updating existing documents cleanly purges old vector chunks before re-indexing.

### Option B: Meeting Notes Extractor (Human-in-the-Loop)
- Paste messy meeting notes or sales WhatsApp chats ➔ Gemini 1.5 Flash extracts Contact, Company, Deal Value in RM, and Follow-up action items into strict JSON Schema.
- Sales rep reviews and edits in a preview modal before clicking **[Confirm & Save to CRM]**.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Lucide Icons (Dark Enterprise SaaS Aesthetic)
- **Database & Vector Store**: Supabase (PostgreSQL 15+ with `pgvector`)
- **LLM & Embeddings**: Google Gemini 1.5 Flash + `text-embedding-004`
- **Validation**: Zod + TypeScript end-to-end type safety

---

## 🏃 Quick Start Guide (Run Locally)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on v20.19.0)
- **npm** or **pnpm**
- A free **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- A free **Supabase Project** from [supabase.com](https://supabase.com/) (or local PostgreSQL with pgvector)

### 2. Installation
```bash
# Clone repository
git clone <your-repo-url>
cd "YYC Assessment"

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 4. Database Setup
1. Open your Supabase Dashboard ➔ **SQL Editor**.
2. Copy and paste the contents of **`src/db/schema.sql`** and click **Run**.
3. This creates all tables, the `pgvector` extension, HNSW index, vector search RPC function, and initial seed data.

### 5. Ingest Tax Documents & Run Evaluation
```bash
# Ingest 5 Malaysian Tax PDFs into vector store
npm run ingest

# Run 10-query benchmark evaluation test suite
npm run eval
```

### 6. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📁 Project Structure

```
├── assessment-brief/      # Original case study PDF & forms
├── design/                # System architecture diagram (SVG) & UI prototype (HTML)
├── knowledge-base/        # 5 official Malaysian tax documents
├── scripts/
│   ├── ingest.ts          # CLI script to parse, embed, and store tax chunks
│   └── evaluate.ts        # 10-question evaluation benchmark suite
├── src/
│   ├── app/               # Next.js App Router (Dashboard, Leads, Kanban, APIs)
│   ├── components/        # TaxChatDrawer, NotesExtractorModal, LeadsTable
│   ├── db/schema.sql      # Database DDL & seed data
│   ├── lib/               # Gemini & Supabase client wrappers
│   └── types/             # End-to-end TypeScript interfaces
├── ARCHITECTURE.md        # Comprehensive system design & architecture brief
├── AI_USAGE.md            # Mandatory AI co-development documentation
└── README.md              # Project documentation & run guide
```

---

## 📄 Key Documentation & Design Deliverables
- 🎨 **[Live Figma Design (Interactive Canvas)](https://www.figma.com/design/UmfYUMCBRhJIRRETTD8WVV)**: Full dark-mode SaaS design with Sidebar, KPI cards, Kanban pipeline, and Tax RAG drawer.
- 📐 **[ARCHITECTURE.md](ARCHITECTURE.md)**: Full 4-tier component diagram, database ERD, RAG retrieval strategy, and candidate self-reflection.
- 🤖 **[AI_USAGE.md](AI_USAGE.md)**: Complete record of AI co-development, prompt iterations, schema corrections, and engineering reflections.
- 🖼️ **[design/architecture-diagram.svg](design/architecture-diagram.svg)**: High-resolution standalone component architecture graphic.
