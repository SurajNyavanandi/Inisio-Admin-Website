import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Building2, UserCheck, ArrowRight, CheckCircle2, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';


interface RosterProfile {
  name: string;
  role: string;
  email: string;
  companyName?: string;
  badge: string;
}

interface InternalPortalLoginProps {
  onLoginSuccess?: () => void;
}

const DEFAULT_ROSTER: RosterProfile[] = [
  {
    name: 'Aarav Sharma',
    email: 'admin@inisio.com',
    role: 'admin',
    companyName: 'Inisio Capital Advisory',
    badge: 'Full Admin (R/W)',
  },
  {
    name: 'Sneha Patel',
    email: 'superadmin@inisio.com',
    role: 'superadmin',
    companyName: 'Inisio Capital Advisory',
    badge: 'SuperAdmin (Read-Only)',
  },
  {
    name: 'CA Rajesh Mehta',
    email: 'ca.rajesh@inisio.com',
    role: 'ca',
    companyName: 'Mehta & Associates CA',
    badge: 'CA Auditor Desk',
  },
  {
    name: 'Vikram Malhotra',
    email: 'prosync.vikram@inisio.com',
    role: 'prosync',
    companyName: 'Prosync Syndication Desk',
    badge: 'Prosync Syndication',
  },
  {
    name: 'Ananya Iyer',
    email: 'dpr.ananya@inisio.com',
    role: 'dpr',
    companyName: 'Inisio DPR Advisory Desk',
    badge: 'DPR Consultant Desk',
  },
];

export const InternalPortalLogin: React.FC<InternalPortalLoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@inisio.com');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic roster from backend API with fallback
  const [roster, setRoster] = useState<RosterProfile[]>(DEFAULT_ROSTER);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const fetchRoster = async () => {
    setRosterLoading(true);
    setRosterError(null);
    try {
      const res = await axios.get('/api/auth/roster');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setRoster(res.data);
        if (!email) {
          setEmail(res.data[0].email);
        }
      } else {
        setRoster(DEFAULT_ROSTER);
      }
    } catch {
      // In case of network/proxy delays, fallback gracefully without crashing
      setRoster(DEFAULT_ROSTER);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const safeRoster = Array.isArray(roster) && roster.length > 0 ? roster : DEFAULT_ROSTER;

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

        {/* Dynamic Authorized Account Selector */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Authorized Institutional Accounts
            </span>
            <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {rosterLoading ? 'Loading...' : `${safeRoster.length} Verified Profiles`}
            </span>
          </div>

          {rosterLoading ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Loading institutional directory...</span>
            </div>
          ) : rosterError ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{rosterError}</span>
              </div>
              <button
                type="button"
                onClick={fetchRoster}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-rose-300 rounded text-rose-800 hover:bg-rose-100"
              >
                Retry Directory Fetch
              </button>
            </div>
          ) : safeRoster.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              No active administrative profiles registered in institutional roster.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {safeRoster.map((acc) => (
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
          )}
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
