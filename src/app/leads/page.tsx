'use client';

import React, { useEffect, useState } from 'react';
import { Lead, LeadStatus } from '@/types/crm';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal state - Add Lead
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<LeadStatus>('Lead');

  // Modal state - Edit Lead
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<LeadStatus>('Lead');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (statusFilter !== 'All') queryParams.set('status', statusFilter);

      const res = await fetch(`/api/leads?${queryParams.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) setLeads(data);
    } catch {
      console.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCompany || !newEmail || !newPhone) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          company: newCompany,
          email: newEmail,
          phone: newPhone,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewName('');
        setNewCompany('');
        setNewEmail('');
        setNewPhone('');
        fetchLeads();
      }
    } catch {
      alert('Failed to create lead');
    }
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditLead(lead);
    setEditName(lead.name);
    setEditCompany(lead.company);
    setEditEmail(lead.email);
    setEditPhone(lead.phone);
    setEditStatus(lead.status);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLead || !editName || !editCompany || !editEmail || !editPhone) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editLead.id,
          name: editName,
          company: editCompany,
          email: editEmail,
          phone: editPhone,
          status: editStatus,
        }),
      });

      if (res.ok) {
        setEditLead(null);
        fetchLeads();
      } else {
        alert('Failed to update lead');
      }
    } catch {
      alert('Failed to update lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
      fetchLeads();
    } catch {
      alert('Failed to delete lead');
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Customer':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-[10px]">Customer</span>;
      case 'Prospect':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium text-[10px]">Prospect</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium text-[10px]">Lead</span>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Leads &amp; Contacts Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer relationships and pipeline contacts across their lifecycle</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-sm"
        >
          + Add New Lead
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 flex-1 w-full max-w-md">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, or email..."
            className="w-full bg-transparent border-0 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Lead">Lead</option>
            <option value="Prospect">Prospect</option>
            <option value="Customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#0f172a] shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="p-4">Contact Name</th>
              <th className="p-4">Company</th>
              <th className="p-4">Email / Phone</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Loading contacts...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No contacts found. Click &quot;+ Add New Lead&quot; to create one.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-semibold text-slate-100">{lead.name}</td>
                  <td className="p-4 text-slate-400">{lead.company}</td>
                  <td className="p-4">
                    <div className="text-slate-300">{lead.email}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{lead.phone}</div>
                  </td>
                  <td className="p-4">{getStatusBadge(lead.status)}</td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => handleOpenEditModal(lead)}
                      className="text-blue-400 hover:text-blue-300 font-medium text-xs transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-red-400 hover:text-red-300 font-medium text-xs transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Add New Contact / Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Dato Sri Jeffrey"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company Name:</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. Mega Logistics Bhd"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. jeffrey@megalogistics.com.my"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number (Malaysia):</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="e.g. 012-3456789"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status:</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as LeadStatus)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Lead">Lead</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100">Edit Contact / Lead</h3>
              <button onClick={() => setEditLead(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Dato Sri Jeffrey"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Company Name:</label>
                <input
                  type="text"
                  required
                  value={editCompany}
                  onChange={e => setEditCompany(e.target.value)}
                  placeholder="e.g. Mega Logistics Bhd"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address:</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="e.g. jeffrey@megalogistics.com.my"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number (Malaysia):</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="e.g. 012-3456789"
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status:</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as LeadStatus)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Lead">Lead</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditLead(null)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  Update Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
