import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('wf_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wf_token'));

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const data = res.data;
    setToken(data.access_token);
    const userObj: User = {
      id: data.user_id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      email: '',
      is_active: true,
    };
    setUser(userObj);
    localStorage.setItem('wf_token', data.access_token);
    localStorage.setItem('wf_user', JSON.stringify(userObj));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wf_token');
    localStorage.removeItem('wf_user');
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isAuthenticated: !!token && !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
