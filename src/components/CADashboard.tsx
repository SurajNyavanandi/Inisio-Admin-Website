import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle2, AlertCircle, Clock, ShieldCheck, Edit3, X, Save, RefreshCw, BarChart2 } from 'lucide-react';
import { AssessmentRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const CADashboard: React.FC = () => {
  const { checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AssessmentRecord | null>(null);

  // Form edit states
  const [cmaAuditStatus, setCmaAuditStatus] = useState<'Passed' | 'Under Review' | 'Observations Flagged'>('Under Review');
  const [bankabilityStatus, setBankabilityStatus] = useState<'High Bankability' | 'Moderate Feasibility' | 'Critical Risk'>('High Bankability');
  const [dscr, setDscr] = useState<number>(1.75);
  const [debtEquityRatio, setDebtEquityRatio] = useState<string>('2.00 : 1');
  const [assignedCA, setAssignedCA] = useState<string>('CA Rajesh Mehta');
  const [saving, setSaving] = useState(false);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/assessments/all', getAuthHeaders());
      setAssessments(res.data);
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to load CA assessment records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleOpenAuditModal = (asm: AssessmentRecord) => {
    setSelectedAudit(asm);
    setCmaAuditStatus(asm.cmaAuditStatus);
    setBankabilityStatus(asm.bankabilityStatus);
    setDscr(asm.dscr);
    setDebtEquityRatio(asm.debtEquityRatio);
    setAssignedCA(asm.assignedCA);
  };

  const handleSaveAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit) return;
    if (checkSuperAdminRestriction('CMA audit update')) return;

    setSaving(true);
    try {
      await axios.put(
        `/api/projects/${selectedAudit.id}/audit`,
        {
          cmaAuditStatus,
          bankabilityStatus,
          dscr: Number(dscr),
          debtEquityRatio,
          assignedCA,
        },
        getAuthHeaders()
      );

      showNotification(`CMA audit for ${selectedAudit.companyName} updated to '${cmaAuditStatus}'`, 'success');
      fetchAssessments();
      setSelectedAudit(null);
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Audit update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Metric computations
  const totalAudits = assessments.length;
  const passedAudits = assessments.filter((a) => a.cmaAuditStatus === 'Passed').length;
  const flaggedAudits = assessments.filter((a) => a.cmaAuditStatus === 'Observations Flagged').length;
  const avgDscr = totalAudits > 0 ? (assessments.reduce((acc, a) => acc + a.dscr, 0) / totalAudits).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold mb-2">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" /> Chartered Accountant Underwriting Desk
          </div>
          <h1 className="text-xl font-extrabold text-white">CMA Data & Financial Ratio Audit Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Review Debt Service Coverage Ratios (DSCR), current ratios, and bankability metrics for lead syndication.</p>
        </div>
        <button
          onClick={fetchAssessments}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Audits
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Total CMA Audits</span>
          <span className="text-2xl font-bold font-mono text-slate-900">{totalAudits}</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Passed Audit Compliance</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-5 h-5" /> {passedAudits}
          </span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Average DSCR Benchmark</span>
          <span className="text-2xl font-bold font-mono text-blue-600 flex items-center gap-1">
            <BarChart2 className="w-5 h-5" /> {avgDscr}x
          </span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Observations Flagged</span>
          <span className="text-2xl font-bold font-mono text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-5 h-5" /> {flaggedAudits}
          </span>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Active CMA Audit Underwriting Queue
          </h2>
          <span className="text-xs font-mono text-slate-500">{assessments.length} Projects</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Company & Sector</th>
                <th className="p-3">Debt : Equity</th>
                <th className="p-3">DSCR Ratio</th>
                <th className="p-3">Current Ratio</th>
                <th className="p-3">Bankability Assessment</th>
                <th className="p-3">CMA Audit Status</th>
                <th className="p-3">Auditor</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((asm) => (
                <tr key={asm.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">
                    <div>{asm.companyName}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{asm.projectSector}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-800">{asm.debtEquityRatio}</td>
                  <td className="p-3 font-mono font-bold text-blue-600">{asm.dscr.toFixed(2)}x</td>
                  <td className="p-3 font-mono text-slate-800">{asm.currentRatio.toFixed(2)}x</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        asm.bankabilityStatus === 'High Bankability'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : asm.bankabilityStatus === 'Moderate Feasibility'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {asm.bankabilityStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        asm.cmaAuditStatus === 'Passed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : asm.cmaAuditStatus === 'Under Review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {asm.cmaAuditStatus}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{asm.assignedCA}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenAuditModal(asm)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Audit CMA Ratios: {selectedAudit.companyName}
              </h3>
              <button onClick={() => setSelectedAudit(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CMA Audit Compliance Status</label>
                <select
                  value={cmaAuditStatus}
                  onChange={(e) => setCmaAuditStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Passed">Passed (Compliant for Syndication)</option>
                  <option value="Under Review">Under Review (Provisional)</option>
                  <option value="Observations Flagged">Observations Flagged (Requires Correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bankability Rating</label>
                <select
                  value={bankabilityStatus}
                  onChange={(e) => setBankabilityStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="High Bankability">High Bankability (Emerald Tier)</option>
                  <option value="Moderate Feasibility">Moderate Feasibility (Amber Tier)</option>
                  <option value="Critical Risk">Critical Risk (Rose Tier)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">DSCR Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dscr}
                    onChange={(e) => setDscr(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Debt : Equity Ratio</label>
                  <input
                    type="text"
                    value={debtEquityRatio}
                    onChange={(e) => setDebtEquityRatio(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Auditor</label>
                <input
                  type="text"
                  value={assignedCA}
                  onChange={(e) => setAssignedCA(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAudit(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Audit Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
