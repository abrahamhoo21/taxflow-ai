import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, Users, KanbanSquare, Building2, User } from 'lucide-react';
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/20">
                YYC
              </div>
              <div>
                <div className="font-bold text-slate-100 tracking-tight leading-none text-base">taxPOD CRM</div>
                <div className="text-xs text-slate-400 mt-1">Enterprise Sales &amp; AI</div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/leads"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Leads &amp; Contacts</span>
              </Link>
              <Link
                href="/pipeline"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium text-sm transition"
              >
                <KanbanSquare className="w-4 h-4 text-amber-400" />
                <span>Pipeline (Kanban)</span>
              </Link>
            </nav>
          </div>

          {/* Bottom Profile */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="font-medium text-sm text-slate-200 truncate">Abraham Hoo</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span>YYC taxPOD KL</span>
                </div>
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
