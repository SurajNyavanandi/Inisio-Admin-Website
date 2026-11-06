import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Mail, Phone, Clock, MessageSquare, CheckCircle2, Trash2, Archive, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { InquiryRecord, InquiryStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface AdminLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLeadsModal: React.FC<AdminLeadsModalProps> = ({ isOpen, onClose }) => {
  const { user, checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null);

  // Editable inquiry detail fields
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<InquiryStatus>('New');
  const [editStaff, setEditStaff] = useState('');

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/contact', getAuthHeaders());
      setInquiries(res.data);
      if (res.data.length > 0 && !selectedInquiry) {
        setSelectedInquiry(res.data[0]);
        setEditNotes(res.data[0].internalNotes || '');
        setEditStatus(res.data[0].status);
        setEditStaff(res.data[0].assignedStaff || '');
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to fetch inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInquiries();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectInquiry = (inq: InquiryRecord) => {
    setSelectedInquiry(inq);
    setEditNotes(inq.internalNotes || '');
    setEditStatus(inq.status);
    setEditStaff(inq.assignedStaff || '');
  };

  const handleSaveInquiryChanges = async () => {
    if (!selectedInquiry) return;
    if (checkSuperAdminRestriction('Inquiry status update')) return;

    try {
      const res = await axios.put(
        `/api/admin/contact/${selectedInquiry.id}`,
        {
          status: editStatus,
          internalNotes: editNotes,
          assignedStaff: editStaff,
        },
        getAuthHeaders()
      );
      showNotification(`Inquiry #${selectedInquiry.id} updated`, 'success');
      // Update local state
      setInquiries((prev) =>
        prev.map((i) => (i.id === selectedInquiry.id ? { ...i, ...res.data.inquiry } : i))
      );
      setSelectedInquiry((prev) => (prev ? { ...prev, status: editStatus, internalNotes: editNotes, assignedStaff: editStaff } : null));
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to update inquiry', 'error');
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedInquiry) return;
    if (checkSuperAdminRestriction('Archive inquiry')) return;

    const newArchivedState = !selectedInquiry.isArchived;
    try {
      await axios.put(
        `/api/admin/contact/${selectedInquiry.id}`,
        { isArchived: newArchivedState },
        getAuthHeaders()
      );
      showNotification(newArchivedState ? 'Inquiry archived' : 'Inquiry unarchived', 'info');
      setInquiries((prev) =>
        prev.map((i) => (i.id === selectedInquiry.id ? { ...i, isArchived: newArchivedState } : i))
      );
      setSelectedInquiry((prev) => (prev ? { ...prev, isArchived: newArchivedState } : null));
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Archive toggle failed', 'error');
    }
  };

  const handleDeleteInquiry = async () => {
    if (!selectedInquiry) return;
    if (checkSuperAdminRestriction('Delete inquiry')) return;

    if (!window.confirm(`Permanently delete inquiry from ${selectedInquiry.fullName}?`)) return;

    try {
      await axios.delete(`/api/admin/contact/${selectedInquiry.id}`, getAuthHeaders());
      showNotification('Inquiry deleted permanently', 'success');
      const filtered = inquiries.filter((i) => i.id !== selectedInquiry.id);
      setInquiries(filtered);
      setSelectedInquiry(filtered.length > 0 ? filtered[0] : null);
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Delete inquiry failed', 'error');
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (!showArchived && inq.isArchived) return false;
    if (selectedStatus !== 'all' && inq.status.toLowerCase() !== selectedStatus.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        inq.fullName.toLowerCase().includes(q) ||
        inq.email.toLowerCase().includes(q) ||
        inq.subject.toLowerCase().includes(q) ||
        inq.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden my-4">
        {/* Top Bar with Admin Auth Verification Banner */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Inbound Enterprise Inquiries Console
                <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Auth Verified: {user?.role.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage client contact forms, assigned staff, and resolution lifecycle</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchInquiries}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh Inquiries"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Split List & Detail View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          {/* Left Panel: Filter & List */}
          <div className="w-full md:w-5/12 border-r border-slate-200 flex flex-col bg-white">
            {/* Search & Filter Toolbar */}
            <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search inquiries..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {['all', 'New', 'In Progress', 'Contacted', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                        selectedStatus === st
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-1 cursor-pointer text-[11px] text-slate-600 shrink-0 ml-1">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Archived</span>
                </label>
              </div>
            </div>

            {/* Inquiries List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredInquiries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No inquiries found matching current filters.
                </div>
              ) : (
                filteredInquiries.map((inq) => {
                  const isSelected = selectedInquiry?.id === inq.id;
                  return (
                    <div
                      key={inq.id}
                      onClick={() => handleSelectInquiry(inq)}
                      className={`p-3.5 cursor-pointer transition-all border-l-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-blue-600'
                          : 'border-l-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[180px]">
                          {inq.fullName}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            inq.status === 'New'
                              ? 'bg-blue-100 text-blue-800'
                              : inq.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : inq.status === 'Contacted'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">{inq.subject}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{inq.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{inq.email}</span>
                        <span>{inq.createdAt}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Detail & Actions */}
          <div className="w-full md:w-7/12 flex flex-col bg-white overflow-y-auto">
            {selectedInquiry ? (
              <div className="p-6 space-y-6 flex-1 flex flex-col">
                {/* Header Meta */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs font-mono text-blue-600 font-semibold">{selectedInquiry.id}</span>
                    <h3 className="text-lg font-bold text-slate-900">{selectedInquiry.fullName}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedInquiry.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedInquiry.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleArchive}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-colors ${
                        selectedInquiry.isArchived
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{selectedInquiry.isArchived ? 'Unarchive' : 'Archive'}</span>
                    </button>
                    <button
                      onClick={handleDeleteInquiry}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inquiry Message Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Subject: {selectedInquiry.subject}
                  </h4>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {selectedInquiry.message}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Submitted: {selectedInquiry.createdAt}
                  </div>
                </div>

                {/* Status & Staff Control Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" /> Lifecycle Status & Staff Assignment
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as InquiryStatus)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Desk Staff</label>
                      <select
                        value={editStaff}
                        onChange={(e) => setEditStaff(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Vikram Malhotra">Vikram Malhotra (Prosync)</option>
                        <option value="Ananya Iyer">Ananya Iyer (DPR)</option>
                        <option value="CA Rajesh Mehta">CA Rajesh Mehta (CA)</option>
                        <option value="Aarav Sharma">Aarav Sharma (Admin)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Internal Notes & Audit Trail
                    </label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add internal notes regarding client call outcomes, requested collateral, etc..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveInquiryChanges}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Inquiry Updates</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs my-auto">
                Select an inquiry from the list to view detailed message & manage staff assignment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
