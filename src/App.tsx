import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDashboardView } from './components/AdminDashboardView';
import { InternalPortalLogin } from './components/InternalPortalLogin';
import { CADashboard } from './components/CADashboard';
import { DPRConsultantDashboard } from './components/DPRConsultantDashboard';
import { ProsyncDashboard } from './components/ProsyncDashboard';
import { ForbiddenPage } from './components/ForbiddenPage';
import { Building2, LogOut, ShieldCheck, AlertCircle, X } from 'lucide-react';

type NavigationTab = 'admin' | 'ca' | 'dpr' | 'prosync' | 'login';

const AppContent: React.FC = () => {
  const { user, logout, notification, clearNotification } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('admin');

  // Role validation helper
  const canAccessTab = (tab: NavigationTab): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    if (tab === 'ca' && user.role === 'ca') return true;
    if (tab === 'dpr' && (user.role === 'dpr' || user.role === 'ca')) return true;
    if (tab === 'prosync' && user.role === 'prosync') return true;
    return false;
  };

  const renderActiveView = () => {
    if (!user && activeTab !== 'login') {
      return <InternalPortalLogin onLoginSuccess={() => setActiveTab('admin')} />;
    }

    if (activeTab === 'login') {
      return <InternalPortalLogin onLoginSuccess={() => setActiveTab('admin')} />;
    }

    // Role-based access control check
    if (user && !canAccessTab(activeTab)) {
      const roleMap: Record<NavigationTab, string[]> = {
        admin: ['admin', 'superadmin'],
        ca: ['admin', 'superadmin', 'ca'],
        dpr: ['admin', 'superadmin', 'dpr'],
        prosync: ['admin', 'superadmin', 'prosync'],
        login: [],
      };
      return (
        <ForbiddenPage
          requiredRoles={roleMap[activeTab]}
          onNavigateHome={() => setActiveTab('admin')}
          onSwitchAccount={() => setActiveTab('login')}
        />
      );
    }

    switch (activeTab) {
      case 'admin':
        return <AdminDashboardView />;
      case 'ca':
        return <CADashboard />;
      case 'dpr':
        return <DPRConsultantDashboard />;
      case 'prosync':
        return <ProsyncDashboard />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Global Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-xl border text-xs flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : notification.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : notification.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={clearNotification} className="text-slate-400 hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('admin');
              }}
              className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors"
            >
              Inisio <span className="text-blue-600 font-medium">Admin</span>
            </a>
          </div>

          {/* Zone 2: Single-line Text Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {[
              { id: 'admin', label: 'Admin Console' },
              { id: 'ca', label: 'CA Auditor Desk' },
              { id: 'dpr', label: 'DPR Consultant Desk' },
              { id: 'prosync', label: 'Prosync Syndication' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavigationTab)}
                  className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: User Role & Auth Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                    {user.name}
                    {user.role === 'superadmin' && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                        Read-Only
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Logout from portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      {/* Corporate Advisory Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">Inisio Capital Advisory Services</span>
            <span>· Institutional Debt Placement & Bankability Portal</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ISO 9001:2026 Audit Compliant</span>
            <span>·</span>
            <span>JWT Role Authorization</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI exception in component tree:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('inisio_admin_token');
    localStorage.removeItem('inisio_admin_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Portal State Recovery</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              An unexpected render anomaly occurred. You can safely reload the console to reset view state.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Reload Console
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

