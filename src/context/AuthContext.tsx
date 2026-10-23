import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUser, switchUserRole, switchDemoUser, logout as apiLogout } from '../lib/api/auth';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  toggleRole: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  switchToDemoUser: (type: 'customer' | 'provider') => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isPro: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const toggleRole = async () => {
    if (!user) return;
    const nextRole: UserRole = user.activeRole === 'customer' ? 'provider' : 'customer';
    const updated = await switchUserRole(nextRole);
    setUser(updated);
  };

  const setRole = async (newRole: UserRole) => {
    if (!user) return;
    const updated = await switchUserRole(newRole);
    setUser(updated);
  };

  const switchToDemoUser = async (type: 'customer' | 'provider') => {
    setLoading(true);
    const u = await switchDemoUser(type);
    setUser(u);
    setLoading(false);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    role: user?.activeRole || 'customer',
    loading,
    toggleRole,
    setRole,
    switchToDemoUser,
    refreshUser: fetchUser,
    logout,
    isPro: user?.activeRole === 'provider',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
