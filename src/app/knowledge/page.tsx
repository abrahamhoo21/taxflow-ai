'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database,
  Layers,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { DocumentSummary } from '@/services/rag.service';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/rag/documents');
      if (!res.ok) {
        throw new Error(`Failed to load documents: ${res.statusText}`);
      }
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Invalid file format. Please upload official PDF documents (.pdf) only.');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndIngest = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);
      setUploadProgress('Extracting PDF pages and physical layout...');

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulating stepped feedback
      const timer1 = setTimeout(() => {
        setUploadProgress('Generating 768-dim embeddings with Google Gemini...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setUploadProgress('Writing vector chunks to Supabase pgvector...');
      }, 4000);

      const res = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process and ingest document.');
      }

      setSuccessMsg(
        `Successfully ingested "${data.document.docName}" (${data.document.pagesCount} pages, ${data.document.chunksCount} chunks). RAG Chatbot is now updated!`
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDelete = async (docName: string) => {
    if (!confirm(`Are you sure you want to remove "${docName}" from the vector database? The RAG chatbot will no longer be able to reference it.`)) {
      return;
    }

    try {
      setDeletingDoc(docName);
      setError(null);
      const res = await fetch('/api/rag/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_name: docName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete document chunks.');
      }

      setSuccessMsg(`Document "${docName}" removed from vector database.`);
      await fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setDeletingDoc(null);
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + d.chunks_count, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <span>Tax Knowledge Base Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage statutory Malaysian tax documents and guidelines powering the RAG AI Assistant.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition self-start sm:self-auto border border-slate-700/60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{documents.length}</div>
            <div className="text-xs text-slate-400 font-medium">Ingested Tax Documents</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{totalChunks}</div>
            <div className="text-xs text-slate-400 font-medium">Vector Chunks in Database</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">768-dim</div>
            <div className="text-xs text-slate-400 font-medium">gemini-embedding-001</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-600/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">&ge; 0.50</div>
            <div className="text-xs text-slate-400 font-medium">Cosine Guardrail Filter</div>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Upload Zone (For Non-Technical Users) */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              <span>Upload &amp; Process New Statutory Document</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Non-technical upload: drop an official LHDN or RMCD PDF here to automatically chunk, embed, and index it into pgvector.
            </p>
          </div>
        </div>

        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
            dragOver
              ? 'border-blue-500 bg-blue-500/5'
              : selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            accept=".pdf"
            className="hidden"
          />

          {selectedFile ? (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-100">{selectedFile.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Vector Ingestion
                </div>
              </div>
              <p className="text-xs text-emerald-400 font-medium">
                Click &quot;Ingest to Vector Database&quot; below to process.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Drag and drop your tax PDF here, or <span className="text-blue-400 underline">browse</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports official PDF rulings, e-invoicing specifications, and tax guidelines up to 25MB.
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm transition"
            >
              Cancel
            </button>

            <button
              onClick={handleUploadAndIngest}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgress || 'Processing Document...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Ingest to Vector Database</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Active Indexed Documents Table */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Indexed Tax Documents in Vector Store</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              These documents are actively queryable by the RAG Tax AI Assistant.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <div className="text-sm text-slate-400">Loading vector index registry...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm">No tax documents indexed yet.</div>
            <div className="text-xs text-slate-500">Upload a PDF above or run npm run ingest to begin.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="py-3 px-4 font-semibold">Document Name</th>
                  <th className="py-3 px-4 font-semibold text-center">Pages</th>
                  <th className="py-3 px-4 font-semibold text-center">Vector Chunks</th>
                  <th className="py-3 px-4 font-semibold">Last Ingested</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map(doc => (
                  <tr key={doc.doc_name} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-red-600/10 text-red-400 border border-red-500/20">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-200">{doc.doc_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                      {doc.total_pages}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-xs font-semibold">
                        {doc.chunks_count} chunks
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {new Date(doc.last_ingested_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.doc_name)}
                        disabled={deletingDoc === doc.doc_name}
                        title="Remove document from vector database"
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      >
                        {deletingDoc === doc.doc_name ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
