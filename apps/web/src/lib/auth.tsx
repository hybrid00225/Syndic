'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, clearToken, getToken, setToken } from './api';

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  syndicId: string;
  adminSyndic: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  register: (dto: RegisterInput) => Promise<void>;
  logout: () => void;
}

export interface RegisterInput {
  syndicNom: string;
  pays: string;
  nom: string;
  email: string;
  motDePasse: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback(
    async (token: string, u: AuthUser) => {
      setToken(token);
      setUser(u);
    },
    [],
  );

  const login = useCallback(
    async (email: string, motDePasse: string) => {
      const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, motDePasse }),
      });
      await handleAuth(res.token, res.user);
    },
    [handleAuth],
  );

  const register = useCallback(
    async (dto: RegisterInput) => {
      const res = await api<{ token: string; user: AuthUser }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(dto) },
      );
      await handleAuth(res.token, res.user);
    },
    [handleAuth],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
