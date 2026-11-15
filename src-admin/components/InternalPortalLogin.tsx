import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Building2, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface InternalPortalLoginProps {
  onLoginSuccess?: () => void;
}

export const InternalPortalLogin: React.FC<InternalPortalLoginProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your authorized email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
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
                placeholder="admin@inisio.in"
                autoComplete="email"
              />
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
                placeholder="••••••••••••"
                autoComplete="current-password"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating Credentials...</span>
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

export default InternalPortalLogin;
