import React, { useState } from 'react';
import { X, User, Shield, CheckCircle2, Clock, AlertTriangle, Trash2, Key, Building, Percent, FileText } from 'lucide-react';
import { UserProfile, UserRole, AccountStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface UserProfileDetailModalProps {
  userRecord: UserProfile | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const UserProfileDetailModal: React.FC<UserProfileDetailModalProps> = ({
  userRecord,
  onClose,
  onUserUpdated,
}) => {
  const { checkSuperAdminRestriction, getAuthHeaders, showNotification } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRecord?.role || 'user');
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>(userRecord?.status || 'active');
  const [updating, setUpdating] = useState(false);

  if (!userRecord) return null;

  const handleUpdateRole = async () => {
    if (checkSuperAdminRestriction('Role modification')) return;
    setUpdating(true);
    try {
      await axios.put(`/api/users/${userRecord.id}/role`, { role: selectedRole }, getAuthHeaders());
      showNotification(`Updated role for ${userRecord.name} to '${selectedRole}'`, 'success');
      onUserUpdated();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Role update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus: AccountStatus) => {
    if (checkSuperAdminRestriction('Account status change')) return;
    setUpdating(true);
    try {
      await axios.put(`/api/users/${userRecord.id}/status`, { status: newStatus }, getAuthHeaders());
      setSelectedStatus(newStatus);
      showNotification(`Updated account status for ${userRecord.name} to '${newStatus}'`, 'success');
      onUserUpdated();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'Status update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (checkSuperAdminRestriction('User deletion')) return;
    if (!window.confirm(`Are you sure you want to permanently delete account '${userRecord.name}' (${userRecord.email})?`)) {
      return;
    }
    setUpdating(true);
    try {
      await axios.delete(`/api/users/${userRecord.id}`, getAuthHeaders());
      showNotification(`User '${userRecord.name}' deleted successfully`, 'success');
      onUserUpdated();
      onClose();
    } catch (err: any) {
      showNotification(err.response?.data?.error || 'User deletion failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {userRecord.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {userRecord.name}
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {userRecord.role.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-400">{userRecord.email} · ID: {userRecord.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status & KYC Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-500 block mb-1">Account Status</span>
              <div className="flex items-center gap-1.5 font-bold">
                {selectedStatus === 'active' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {selectedStatus === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
                {selectedStatus === 'suspended' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span className="capitalize text-slate-900">{selectedStatus}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-500 block mb-1">KYC Audit Status</span>
              <div className="flex items-center gap-1.5 font-bold">
                {userRecord.kycStatus === 'Verified' && (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                )}
                {userRecord.kycStatus === 'Pending Review' && (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Pending Review
                  </span>
                )}
                {userRecord.kycStatus === 'Not Submitted' && (
                  <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Not Submitted
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-500 block mb-1">Email Verification</span>
              <div className="font-bold text-slate-900">
                {userRecord.emailVerified ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                ) : (
                  <span className="text-amber-600">Unverified</span>
                )}
              </div>
            </div>
          </div>

          {/* Business & Shareholding Profile */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" /> Enterprise & Promoter Shareholding
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Registered Entity Name:</span>
                <span className="font-semibold text-slate-900">{userRecord.companyName || 'Individual Account'}</span>
              </div>
              <div>
                <span className="text-slate-500 block flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" /> Promoter Shareholding:
                </span>
                <span className="font-semibold text-slate-900 font-mono">
                  {userRecord.promoterShareholding !== undefined ? `${userRecord.promoterShareholding}% Equity` : 'N/A'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block flex items-center gap-1 mb-0.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Primary Project Requirement:
                </span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  {userRecord.projectRequirement || 'No active project description on file.'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Role & Status Management Controls */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" /> Admin Role & Privileges Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modify User Role</label>
                <div className="flex gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="flex-1 text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User (Client)</option>
                    <option value="admin">Admin (Full R/W)</option>
                    <option value="superadmin">SuperAdmin (Read-Only)</option>
                    <option value="ca">CA (Auditor Desk)</option>
                    <option value="prosync">Prosync (Syndication Desk)</option>
                    <option value="dpr">DPR (Feasibility Desk)</option>
                  </select>
                  <button
                    onClick={handleUpdateRole}
                    disabled={updating || selectedRole === userRecord.role}
                    className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Status Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Set Account Lifecycle Status</label>
                <div className="flex gap-1.5">
                  {(['active', 'suspended', 'pending'] as AccountStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      disabled={updating || selectedStatus === st}
                      className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg capitalize border transition-all ${
                        selectedStatus === st
                          ? st === 'active'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'suspended'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Login Audit Logs */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-600" /> Login Audit Log Trajectory
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Remote IP</th>
                    <th className="p-2.5">Auth Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userRecord.loginAuditLogs && userRecord.loginAuditLogs.length > 0 ? (
                    userRecord.loginAuditLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-700">{log.timestamp}</td>
                        <td className="p-2.5 font-mono text-slate-600">{log.ip}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              log.status === 'Success'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-400">
                        No login audit events recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-200">
            <button
              onClick={handleDeleteUser}
              disabled={updating}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete User Account</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
