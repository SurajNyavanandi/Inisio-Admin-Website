import React, { useState, useEffect } from 'react';
import { Landmark, Calendar, Clock, CheckCircle2, XCircle, UserCheck, Phone, Mail, RefreshCw, Layers } from 'lucide-react';
import { ConsultationRecord, LeadRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const ProsyncDashboard: React.FC = () => {
  const { checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [syndicationLeads, setSyndicationLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        axios.get('/api/consultations', getAuthHeaders()),
        axios.get('/api/leads', getAuthHeaders()),
      ]);
      setConsultations(cRes.data);
      setSyndicationLeads(lRes.data.filter((l: LeadRecord) => l.pipelineStatus === 'Syndication' || l.pipelineStatus === 'Sanctioned'));
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Failed to fetch Prosync syndication data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateConsultationStatus = async (id: string, status: 'Requested' | 'Scheduled' | 'Completed' | 'Cancelled') => {
    if (checkSuperAdminRestriction('Consultation status update')) return;

    try {
      await axios.put(`/api/consultations/${id}/status`, { status }, getAuthHeaders());
      showNotification(`Consultation #${id} updated to '${status}'`, 'success');
      fetchData();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Status update failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold mb-2">
            <Landmark className="w-3.5 h-3.5 text-blue-400" /> Prosync Banking & Loan Syndication Desk
          </div>
          <h1 className="text-xl font-extrabold text-white">Lender Consortium & Advisory Consultation Desk</h1>
          <p className="text-xs text-slate-400 mt-1">Manage institutional debt placement, bank syndication pipelines, and client consultation handoffs.</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg border border-slate-700 flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Operations
        </button>
      </div>

      {/* Grid: Consultations & Syndication Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Consultation Bookings */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Consultation Bookings Queue
            </h2>
            <span className="text-xs font-mono text-slate-500">{consultations.length} Bookings</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {consultations.map((cns) => (
              <div key={cns.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{cns.clientName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      cns.status === 'Scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : cns.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cns.status === 'Requested'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cns.status}
                  </span>
                </div>

                <div className="text-slate-600 font-semibold">{cns.companyName}</div>

                <div className="flex flex-wrap gap-4 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {cns.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {cns.phone}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {cns.scheduledTime}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500">Advisor: <strong className="text-slate-800">{cns.assignedAdvisor}</strong></span>
                  <div className="flex items-center gap-1">
                    {cns.status !== 'Scheduled' && (
                      <button
                        onClick={() => handleUpdateConsultationStatus(cns.id, 'Scheduled')}
                        className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 font-medium"
                      >
                        Schedule
                      </button>
                    )}
                    {cns.status !== 'Completed' && (
                      <button
                        onClick={() => handleUpdateConsultationStatus(cns.id, 'Completed')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 font-medium"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Syndication Consortium Desk */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" /> Active Debt Syndication Pipeline
            </h2>
            <span className="text-xs font-mono text-slate-500">{syndicationLeads.length} Consortium Deals</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {syndicationLeads.map((ld) => (
              <div key={ld.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{ld.companyName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      ld.pipelineStatus === 'Sanctioned'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    {ld.pipelineStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Total Capex:</span>
                    <span className="font-bold font-mono text-slate-900">₹{ld.projectCost} Cr</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Debt Required:</span>
                    <span className="font-bold font-mono text-blue-600">₹{ld.requiredBankDebt} Cr</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 italic bg-slate-100/70 p-2 rounded border border-slate-200">
                  "{ld.notes}"
                </p>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                  <span>Lead Officer: <strong className="text-slate-800">{ld.assignedProsync || 'Vikram Malhotra'}</strong></span>
                  <span className="font-mono text-emerald-700 font-semibold">Bankability: {ld.bankabilityScore}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
