import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckSquare, Square, Clock, ArrowRight, Save, Layers, RefreshCw } from 'lucide-react';
import { LeadRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const DPRConsultantDashboard: React.FC = () => {
  const { checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // DPR Milestones for selected lead
  const [milestones, setMilestones] = useState({
    executiveSummary: true,
    marketStudy: true,
    technicalCapex: true,
    financialProjections: false,
    statutoryClearances: false,
  });
  const [dprNotes, setDprNotes] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/leads', getAuthHeaders());
      const rawLeads = Array.isArray(res.data) ? res.data : [];
      setLeads(rawLeads);
      if (rawLeads.length > 0 && !selectedLead) {
        setSelectedLead(rawLeads[0]);
        setDprNotes(rawLeads[0].notes || '');
      }
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to fetch DPR leads', 'error');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSelectLead = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setDprNotes(lead.notes || '');
  };

  const toggleMilestone = (key: keyof typeof milestones) => {
    if (checkSuperAdminRestriction('DPR milestone update')) return;
    setMilestones((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveDPRProgress = async () => {
    if (!selectedLead) return;
    if (checkSuperAdminRestriction('DPR progress save')) return;

    try {
      await axios.put(
        `/api/leads/${selectedLead.id}`,
        {
          notes: dprNotes,
          pipelineStatus: 'DPR Drafting',
        },
        getAuthHeaders()
      );
      showNotification(`DPR progress for '${selectedLead.companyName}' saved successfully`, 'success');
      fetchLeads();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to save DPR progress', 'error');
    }
  };

  const safeLeads = Array.isArray(leads) ? leads : [];
  const dprLeads = safeLeads.filter(
    (l) => l.pipelineStatus === 'DPR Drafting' || l.pipelineStatus === 'Feasibility Review' || l.assignedDPR === 'Ananya Iyer'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-xs font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" /> Detailed Project Report (DPR) Desk
          </div>
          <h1 className="text-xl font-extrabold text-white">Technical Feasibility & DPR Drafting Console</h1>
          <p className="text-xs text-slate-400 mt-1">Prepare bankable DPR reports, capex schedules, and statutory compliance documentation for consortium approval.</p>
        </div>
        <button
          onClick={fetchLeads}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Pipeline
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lead Selector */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> Assigned DPR Projects ({dprLeads.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
                <span>Loading DPR pipeline projects...</span>
              </div>
            ) : dprLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No enterprise projects currently requiring DPR drafting or technical feasibility review.
              </div>
            ) : (
              dprLeads.map((ld) => {
              const isSelected = selectedLead?.id === ld.id;
              return (
                <div
                  key={ld.id}
                  onClick={() => handleSelectLead(ld)}
                  className={`p-4 cursor-pointer transition-all border-l-3 ${
                    isSelected ? 'bg-purple-50/70 border-l-purple-600' : 'border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{ld.companyName}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      ₹{ld.projectCost} Cr Capex
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">Industry: {ld.industry}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono text-blue-600">Debt: ₹{ld.requiredBankDebt} Cr</span>
                    <span className="font-mono text-slate-400">Score: {ld.bankabilityScore}/100</span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right: DPR Drafting Workbench */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6">
          {selectedLead ? (
            <>
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-mono text-purple-600 font-semibold">{selectedLead.id}</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedLead.companyName}</h2>
                <p className="text-xs text-slate-500">Client Contact: {selectedLead.clientName} ({selectedLead.phone})</p>
              </div>

              {/* Milestone Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  DPR Section Completion Checklist
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { key: 'executiveSummary', label: '1. Executive Summary & Promoter Background' },
                    { key: 'marketStudy', label: '2. Market Potential, Demand & Competition Analysis' },
                    { key: 'technicalCapex', label: '3. Technical Feasibility, Machinery & Capex Estimate' },
                    { key: 'financialProjections', label: '4. Financial Statements, Cash Flows & Sensitivity Analysis' },
                    { key: 'statutoryClearances', label: '5. Environmental, Land & Pollution Clearances' },
                  ].map((m) => {
                    const isChecked = milestones[m.key as keyof typeof milestones];
                    return (
                      <div
                        key={m.key}
                        onClick={() => toggleMilestone(m.key as keyof typeof milestones)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span>{m.label}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                          {isChecked ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultant Underwriting Notes & Lender Remarks
                </label>
                <textarea
                  rows={4}
                  value={dprNotes}
                  onChange={(e) => setDprNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter detailed notes regarding engineering capex, civil construction milestones, or bank query responses..."
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveDPRProgress}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save DPR Report Draft
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a project from the left panel to begin DPR drafting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
