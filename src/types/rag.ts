export interface TaxDocumentChunk {
  id: string;
  doc_name: string;
  page_number: number;
  section_title?: string | null;
  chunk_content: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface Citation {
  doc_name: string;
  page_number: number;
  section_title?: string;
  snippet?: string;
}

export interface RAGQueryRequest {
  question: string;
  top_k?: number;
  similarity_threshold?: number;
}

export interface RAGQueryResponse {
  answer: string;
  citations: Citation[];
  retrieved_chunks_count: number;
  is_grounded: boolean;
  hallucination_warning?: boolean;
}

export interface ExtractedNotes {
  contactName: string;
  companyName: string;
  phone?: string;
  email?: string;
  opportunityTitle?: string;
  dealValueRM?: number;
  stage?: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won';
  actionItems?: string[];
  summary: string;
}
