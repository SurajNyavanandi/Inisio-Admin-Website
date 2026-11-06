import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building,
  DollarSign,
  PieChart,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  User,
  PlusCircle,
  Mail,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Award,
  BookOpen,
  Layers,
  X,
  CheckCircle2,
} from 'lucide-react';
import { LeadRecord, PipelineStatus, FeasibilityRating, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminLeadsModal } from './AdminLeadsModal';
import { UserProfileDetailModal } from './UserProfileDetailModal';
import { LeadEditModal } from './LeadEditModal';
import axios from 'axios';

export const AdminDashboardView: React.FC = () => {
  const { user, checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();

  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feasibilityFilter, setFeasibilityFilter] = useState<string>('all');

  // Modal states
  const [isInquiriesModalOpen, setIsInquiriesModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<LeadRecord | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Industry catalog form
  const [newIndustryName, setNewIndustryName] = useState('');
  const [newIndustrySector, setNewIndustrySector] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.all([
        axios.get('/api/leads', getAuthHeaders()),
        axios.get('/api/users', getAuthHeaders()).catch(() => ({ data: [] })),
      ]);
      setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
      setUsersList(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to fetch pipeline leads', 'error');
      setLeads([]);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Filtered leads computation
  const safeLeads = Array.isArray(leads) ? leads : [];
  const filteredLeads = safeLeads.filter((ld) => {
    if (statusFilter !== 'all' && ld.pipelineStatus !== statusFilter) return false;
    if (feasibilityFilter !== 'all' && ld.feasibilityRating !== feasibilityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ld.companyName.toLowerCase().includes(q) ||
        ld.clientName.toLowerCase().includes(q) ||
        ld.email.toLowerCase().includes(q) ||
        ld.industry.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Calculations
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.projectCost || 0), 0);
  const totalRequiredDebt = leads.reduce((acc, l) => acc + (l.requiredBankDebt || 0), 0);
  const activeLeadsCount = leads.length;
  const highOrModCount = leads.filter((l) => l.feasibilityRating === 'High' || l.feasibilityRating === 'Moderate').length;
  const feasibilityRate = activeLeadsCount > 0 ? ((highOrModCount / activeLeadsCount) * 100).toFixed(1) : '0.0';
  const avgBankabilityScore =
    activeLeadsCount > 0 ? (leads.reduce((acc, l) => acc + (l.bankabilityScore || 0), 0) / activeLeadsCount).toFixed(1) : '0.0';

  // CSV Export Action
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      showNotification('No lead records available to export', 'warning');
      return;
    }

    const headers = ['Lead ID', 'Client Name', 'Company Name', 'Email', 'Phone', 'Project Cost (Cr)', 'Bank Debt (Cr)', 'Bankability Score', 'Feasibility Rating', 'Pipeline Status', 'Industry', 'DPR Staff', 'Prosync Staff', 'CA Staff'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.clientName}"`,
      `"${l.companyName}"`,
      l.email,
      l.phone,
      l.projectCost,
      l.requiredBankDebt,
      l.bankabilityScore,
      l.feasibilityRating,
      l.pipelineStatus,
      `"${l.industry}"`,
      `"${l.assignedDPR || 'Unassigned'}"`,
      `"${l.assignedProsync || 'Unassigned'}"`,
      `"${l.assignedCA || 'Unassigned'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inisio_Admin_Leads_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Pipeline leads exported to CSV successfully', 'success');
  };

  // Clear All Leads Action (Guarded by SuperAdmin restriction check)
  const handleClearAllLeads = async () => {
    if (checkSuperAdminRestriction('Clearing all pipeline leads')) return;

    if (!window.confirm('CRITICAL WARNING: Are you sure you want to permanently clear ALL lead records from the database? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete('/api/leads/clear-all', getAuthHeaders());
      showNotification('All pipeline leads cleared from database', 'success');
      fetchLeads();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to clear leads', 'error');
    }
  };

  // Delete Individual Lead
  const handleDeleteLead = async (id: string, name: string) => {
    if (checkSuperAdminRestriction('Delete lead record')) return;

    if (!window.confirm(`Delete lead record for '${name}'?`)) return;

    try {
      await axios.delete(`/api/leads/${id}`, getAuthHeaders());
      showNotification(`Lead #${id} deleted successfully`, 'success');
      fetchLeads();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  // View User Profile trigger
  const handleOpenUserProfile = async (email: string) => {
    const found = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setSelectedUserForDetail(found);
      return;
    }

    try {
      const res = await axios.get(`/api/users/profile/${encodeURIComponent(email)}`, getAuthHeaders());
      setSelectedUserForDetail(res.data);
    } catch {
      showNotification(`No administrative or registered user profile found for '${email}'`, 'warning');
    }
  };

  // Create Industry Benchmark
  const handleAddIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkSuperAdminRestriction('Add industry catalog benchmark')) return;

    try {
      await axios.post(
        '/api/industries',
        { name: newIndustryName, sector: newIndustrySector },
        getAuthHeaders()
      );
      showNotification(`Industry benchmark '${newIndustryName}' added to master catalog`, 'success');
      setNewIndustryName('');
      setNewIndustrySector('');
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to add industry benchmark', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* SuperAdmin View-Only Restriction Banner (if active) */}
      {user?.role === 'superadmin' && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>SuperAdmin Supervisory Mode Active:</strong> You have Read-Only privileges across administrative leads, users, and audit tables. Mutating operations are reserved for full Admin role.
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/60 text-amber-900 border border-amber-300">
            READ-ONLY
          </span>
        </div>
      )}

      {/* Top Banner & Header Toolbar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Administrative Underwriting Console
          </div>
          <h1 className="text-xl font-extrabold text-white">Inisio Enterprise Pipeline & Lead Administration</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time overview of deal syndication, debt placement, bankability scoring, and internal desk assignments.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsInquiriesModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            <span>Inbound Inquiries</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={() => setIsCatalogOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Master Catalog</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={handleClearAllLeads}
              className="px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 rounded-lg border border-rose-800/60 transition-colors flex items-center gap-1.5"
              title="Clear all lead records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Pipeline</span>
            </button>
          )}

          <button
            onClick={fetchLeads}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Pipeline Value</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">₹{totalPipelineValue.toFixed(1)} Cr</div>
          <span className="text-[11px] text-slate-500">Cumulative Capex Value</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Required Bank Debt</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600">₹{totalRequiredDebt.toFixed(1)} Cr</div>
          <span className="text-[11px] text-slate-500">Total Lender Placement</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Leads</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{activeLeadsCount}</div>
          <span className="text-[11px] text-slate-500">In Active Underwriting</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Feasibility Rate</span>
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{feasibilityRate}%</div>
          <span className="text-[11px] text-slate-500">High / Moderate Feasibility</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Avg Bankability Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{avgBankabilityScore} / 100</div>
          <span className="text-[11px] text-slate-500">Underwriting Metric</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, company, industry..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
            >
              <option value="all">All Pipeline Statuses</option>
              <option value="Inquiry">Inquiry</option>
              <option value="Feasibility Review">Feasibility Review</option>
              <option value="CMA Prepared">CMA Prepared</option>
              <option value="DPR Drafting">DPR Drafting</option>
              <option value="Syndication">Syndication</option>
              <option value="Sanctioned">Sanctioned</option>
              <option value="Closed/Lost">Closed/Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Feasibility:</span>
            <select
              value={feasibilityFilter}
              onChange={(e) => setFeasibilityFilter(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none"
            >
              <option value="all">All Ratings</option>
              <option value="High">High Feasibility</option>
              <option value="Moderate">Moderate Feasibility</option>
              <option value="Low">Low Feasibility</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Leads Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" /> Active Enterprise Pipeline Leads
          </h2>
          <span className="text-xs font-mono text-slate-500">{filteredLeads.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Client & Enterprise</th>
                <th className="p-3">Industry</th>
                <th className="p-3">Capex (Cr)</th>
                <th className="p-3">Bank Debt (Cr)</th>
                <th className="p-3">Bankability Score</th>
                <th className="p-3">Pipeline Status</th>
                <th className="p-3">Assigned Staff</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>Loading pipeline lead records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No lead records match your search or filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((ld) => (
                  <tr key={ld.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{ld.companyName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {ld.clientName} · <span className="font-mono">{ld.email}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">{ld.industry}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{ld.projectCost.toFixed(1)}</td>
                    <td className="p-3 font-mono font-bold text-blue-600">₹{ld.requiredBankDebt.toFixed(1)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              ld.bankabilityScore >= 80
                                ? 'bg-emerald-600'
                                : ld.bankabilityScore >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${ld.bankabilityScore}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800">{ld.bankabilityScore}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            ld.feasibilityRating === 'High'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ld.feasibilityRating === 'Moderate'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ld.feasibilityRating}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ld.pipelineStatus === 'Sanctioned'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : ld.pipelineStatus === 'Syndication'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : ld.pipelineStatus === 'CMA Prepared'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : ld.pipelineStatus === 'DPR Drafting'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {ld.pipelineStatus}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 space-y-0.5">
                      <div>DPR: <span className="font-semibold text-slate-800">{ld.assignedDPR || 'Unassigned'}</span></div>
                      <div>Prosync: <span className="font-semibold text-slate-800">{ld.assignedProsync || 'Unassigned'}</span></div>
                      <div>CA: <span className="font-semibold text-slate-800">{ld.assignedCA || 'Unassigned'}</span></div>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenUserProfile(ld.email)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                        title="Inspect User Profile & Audit Logs"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedLeadForEdit(ld)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                        title="Edit Lead Details & Assignments"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(ld.id, ld.companyName)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AdminLeadsModal
        isOpen={isInquiriesModalOpen}
        onClose={() => setIsInquiriesModalOpen(false)}
      />

      {selectedUserForDetail && (
        <UserProfileDetailModal
          userRecord={selectedUserForDetail}
          onClose={() => setSelectedUserForDetail(null)}
          onUserUpdated={fetchLeads}
        />
      )}

      {selectedLeadForEdit && (
        <LeadEditModal
          lead={selectedLeadForEdit}
          onClose={() => setSelectedLeadForEdit(null)}
          onLeadUpdated={fetchLeads}
        />
      )}

      {/* Master Catalog Drawer/Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" /> Master Catalog & Industry Benchmarks
              </h3>
              <button onClick={() => setIsCatalogOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIndustry} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Add New Industry Underwriting Profile</h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Industry Name</label>
                <input
                  type="text"
                  required
                  value={newIndustryName}
                  onChange={(e) => setNewIndustryName(e.target.value)}
                  placeholder="e.g. Green Hydrogen Infrastructure"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Sector Classification</label>
                <input
                  type="text"
                  required
                  value={newIndustrySector}
                  onChange={(e) => setNewIndustrySector(e.target.value)}
                  placeholder="e.g. Clean Tech & Energy Transition"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Add Benchmark to Catalog
              </button>
            </form>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Close Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
