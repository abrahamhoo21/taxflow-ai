import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TaxChatDrawer } from '@/components/rag/TaxChatDrawer';
import { NotesExtractorModal } from '@/components/ai/NotesExtractorModal';

export const metadata: Metadata = {
  title: 'YYC taxPOD CRM & Tax AI Assistant',
  description: 'Enterprise Sales CRM with RAG-powered Malaysian Tax Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-[#090d16] text-slate-100 antialiased">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-[#0d1322] border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 select-none">
          <div className="space-y-6">
            
            {/* Logo */}
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/20">
                YYC
              </div>
              <div>
                <div className="font-bold text-slate-100 tracking-tight leading-none text-base">taxPOD CRM</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Enterprise Sales &amp; AI</div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 font-medium text-xs transition"
              >
                <span>📊</span> Dashboard
              </Link>
              <Link
                href="/leads"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 font-medium text-xs transition"
              >
                <span>👤</span> Leads &amp; Contacts
              </Link>
              <Link
                href="/pipeline"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/60 font-medium text-xs transition"
              >
                <span>📋</span> Pipeline (Kanban)
              </Link>
            </nav>
          </div>

          {/* Bottom Tax AI Quick Launch & Profile */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-2 pt-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                AB
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-xs text-slate-200 truncate">Abraham (Sales Rep)</div>
                <div className="text-[10px] text-slate-500">YYC taxPOD KL Office</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>

        {/* Global Floating Tax RAG Chat Drawer */}
        <TaxChatDrawer />

        {/* Global Option B: Meeting Notes Extractor Modal */}
        <NotesExtractorModal />

      </body>
    </html>
  );
}
