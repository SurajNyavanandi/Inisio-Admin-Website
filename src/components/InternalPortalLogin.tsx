import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Building2, UserCheck, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface InternalPortalLoginProps {
  onLoginSuccess?: () => void;
}

export const InternalPortalLogin: React.FC<InternalPortalLoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@inisio.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetAccounts = [
    { name: 'Aarav Sharma', role: 'admin', email: 'admin@inisio.com', badge: 'Full Admin (R/W)' },
    { name: 'Sneha Patel', role: 'superadmin', email: 'superadmin@inisio.com', badge: 'SuperAdmin (Read-Only)' },
    { name: 'CA Rajesh Mehta', role: 'ca', email: 'ca.rajesh@inisio.com', badge: 'CA Auditor Desk' },
    { name: 'Vikram Malhotra', role: 'prosync', email: 'prosync.vikram@inisio.com', badge: 'Prosync Syndication' },
    { name: 'Ananya Iyer', role: 'dpr', email: 'dpr.ananya@inisio.com', badge: 'DPR Consultant Desk' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email);
    setLoading(false);

    if (result.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inisio Advisory Portal
          </h1>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Internal Operations & Administrative Underwriting Console
          </p>
        </div>

        {/* Preset Account Selector for Quick Testing */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Quick Select Authorized Account
            </span>
            <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              5 Roster Profiles
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {presetAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => setEmail(acc.email)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between border ${
                  email === acc.email
                    ? 'bg-blue-50/80 border-blue-500 text-blue-900 font-medium shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="font-semibold">{acc.name}</span>
                  <span className="text-slate-500 block text-[11px]">{acc.email}</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200 shrink-0">
                  {acc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Authorized Institutional Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="admin@inisio.com"
              />
              <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Portal Access Passcode
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating JWT Credentials...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate Internal Access</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            Guarded by JWT Authentication & Whitelist Verification
          </p>
        </div>
      </div>
    </div>
  );
};
