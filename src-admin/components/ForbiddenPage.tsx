import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ForbiddenPageProps {
  requiredRoles?: string[];
  onNavigateHome?: () => void;
  onSwitchAccount?: () => void;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  requiredRoles = ['admin'],
  onNavigateHome,
  onSwitchAccount,
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-8 max-w-lg w-full text-center">
        {/* Restrict / Alert Rose Red Banner */}
        <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>HTTP 403 Access Restricted</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Forbidden Area</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Your current account role <span className="font-semibold text-rose-700 uppercase px-2 py-0.5 bg-rose-50 border border-rose-200 rounded">{user?.role || 'Guest'}</span> does not possess the administrative privileges required to access this portal desk.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs mb-6 space-y-2 text-slate-700">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Authenticated User:</span>
            <span className="font-medium text-slate-900">{user?.name || 'Unauthenticated'}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Active Role Token:</span>
            <span className="font-mono text-slate-800">{user?.role || 'none'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Authorized Desk Roles:</span>
            <span className="font-mono text-rose-600 font-semibold">{requiredRoles.join(', ')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
          )}
          <button
            onClick={() => {
              if (onSwitchAccount) onSwitchAccount();
              else logout();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Switch Account / Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
