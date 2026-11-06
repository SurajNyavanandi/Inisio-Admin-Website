import React, { useState, useEffect } from 'react';
import { X, Save, Building, DollarSign, Users, Award, FileText } from 'lucide-react';
import { LeadRecord, PipelineStatus, FeasibilityRating, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface LeadEditModalProps {
  lead: LeadRecord | null;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export const LeadEditModal: React.FC<LeadEditModalProps> = ({ lead, onClose, onLeadUpdated }) => {
  const { checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();

  const [companyName, setCompanyName] = useState(lead?.companyName || '');
  const [projectCost, setProjectCost] = useState(lead?.projectCost || 0);
  const [requiredBankDebt, setRequiredBankDebt] = useState(lead?.requiredBankDebt || 0);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>(lead?.pipelineStatus || 'Inquiry');
  const [feasibilityRating, setFeasibilityRating] = useState<FeasibilityRating>(lead?.feasibilityRating || 'Moderate');
  const [bankabilityScore, setBankabilityScore] = useState(lead?.bankabilityScore ?? 0);
  const [assignedDPR, setAssignedDPR] = useState(lead?.assignedDPR || 'Unassigned');
  const [assignedProsync, setAssignedProsync] = useState(lead?.assignedProsync || 'Unassigned');
  const [assignedCA, setAssignedCA] = useState(lead?.assignedCA || 'Unassigned');
  const [notes, setNotes] = useState(lead?.notes || '');
  const [saving, setSaving] = useState(false);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    axios
      .get('/api/users', getAuthHeaders())
      .then((res) => setStaffUsers(res.data))
      .catch(() => {});
  }, []);

  if (!lead) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkSuperAdminRestriction('Lead editing')) return;

    setSaving(true);
    try {
      // 1. Update lead metrics & status
      await axios.put(
        `/api/leads/${lead.id}`,
        {
          companyName,
          projectCost: Number(projectCost),
          requiredBankDebt: Number(requiredBankDebt),
          pipelineStatus,
          feasibilityRating,
          bankabilityScore: Number(bankabilityScore),
          notes,
        },
        getAuthHeaders()
      );

      // 2. Update staff assignments
      await axios.put(
        `/api/leads/${lead.id}/assignment`,
        {
          assignedDPR,
          assignedProsync,
          assignedCA,
        },
        getAuthHeaders()
      );

      showNotification(`Lead #${lead.id} (${companyName}) updated successfully`, 'success');
      onLeadUpdated();
      onClose();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to save lead updates', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Edit Lead Record #{lead.id}
            </h2>
            <p className="text-xs text-slate-400">Client: {lead.clientName} ({lead.email})</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Company Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Project Title</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Project Cost & Debt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" /> Total Project Capex (₹ Cr)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={projectCost}
                onChange={(e) => setProjectCost(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Required Bank Debt (₹ Cr)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={requiredBankDebt}
                onChange={(e) => setRequiredBankDebt(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pipeline Status & Feasibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Lifecycle Status</label>
              <select
                value={pipelineStatus}
                onChange={(e) => setPipelineStatus(e.target.value as PipelineStatus)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inquiry">1. Inquiry</option>
                <option value="Feasibility Review">2. Feasibility Review</option>
                <option value="CMA Prepared">3. CMA Prepared</option>
                <option value="DPR Drafting">4. DPR Drafting</option>
                <option value="Syndication">5. Syndication</option>
                <option value="Sanctioned">6. Sanctioned</option>
                <option value="Closed/Lost">Closed/Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feasibility Rating</label>
              <select
                value={feasibilityRating}
                onChange={(e) => setFeasibilityRating(e.target.value as FeasibilityRating)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="High">High Feasibility</option>
                <option value="Moderate">Moderate Feasibility</option>
                <option value="Low">Low Feasibility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-600" /> Bankability Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={bankabilityScore}
                onChange={(e) => setBankabilityScore(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Advisory Staff Assignment Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" /> Internal Desk Staff Assignments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">DPR Technical Consultant</label>
                <select
                  value={assignedDPR}
                  onChange={(e) => setAssignedDPR(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Unassigned">Unassigned</option>
                  {staffUsers
                    .filter((u) => u.role === 'dpr' || u.role === 'admin' || u.role === 'superadmin')
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prosync Syndication Officer</label>
                <select
                  value={assignedProsync}
                  onChange={(e) => setAssignedProsync(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Unassigned">Unassigned</option>
                  {staffUsers
                    .filter((u) => u.role === 'prosync' || u.role === 'admin' || u.role === 'superadmin')
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chartered Accountant (Auditor)</label>
                <select
                  value={assignedCA}
                  onChange={(e) => setAssignedCA(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Unassigned">Unassigned</option>
                  {staffUsers
                    .filter((u) => u.role === 'ca' || u.role === 'admin' || u.role === 'superadmin')
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Internal Underwriting & Consortium Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes regarding PPA signatures, land acquisition, DSCR, or bank term sheets..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Lead...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
