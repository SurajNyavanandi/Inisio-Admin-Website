import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { UserRole } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  companyName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkSuperAdminRestriction: (actionDescription?: string) => boolean;
  getAuthHeaders: () => { headers: { Authorization: string } } | {};
  notification: { message: string; type: 'success' | 'error' | 'warning' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  clearNotification: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('inisio_admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('inisio_admin_token') || null;
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const clearNotification = () => setNotification(null);

  const login = async (email: string) => {
    try {
      const response = await axios.post('/api/auth/admin-login', { email });
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('inisio_admin_token', newToken);
      localStorage.setItem('inisio_admin_user', JSON.stringify(newUser));
      showNotification(`Successfully logged in as ${newUser.name} (${newUser.role.toUpperCase()})`, 'success');
      return { success: true };
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      showNotification(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('inisio_admin_token');
    localStorage.removeItem('inisio_admin_user');
    showNotification('Logged out from internal portal', 'info');
  };

  const checkSuperAdminRestriction = (actionDescription = 'This operation') => {
    if (user?.role === 'superadmin') {
      showNotification(
        `Restricted (403): SuperAdmin accounts have strict Read-Only supervisory privileges. ${actionDescription} requires full admin role.`,
        'warning'
      );
      return true; // True means restricted / blocked
    }
    return false;
  };

  const getAuthHeaders = () => {
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        checkSuperAdminRestriction,
        getAuthHeaders,
        notification,
        showNotification,
        clearNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
