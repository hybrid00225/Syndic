'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, clearToken, getToken, setToken, SESSION_EXPIRED_EVENT } from './api';

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
  login: (
    email: string,
    motDePasse: string,
    remember?: boolean,
  ) => Promise<void>;
  register: (dto: RegisterInput, remember?: boolean) => Promise<void>;
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
  const queryClient = useQueryClient();

  // Jeton expiré/révoqué (401) : on vide l'état et le cache (pas de fuite de
  // données vers la session suivante) ; le layout redirige vers /login.
  useEffect(() => {
    const onExpired = () => {
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [queryClient]);

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
    (token: string, u: AuthUser, remember: boolean) => {
      queryClient.clear();
      setToken(token, remember);
      setUser(u);
    },
    [queryClient],
  );

  const login = useCallback(
    async (email: string, motDePasse: string, remember = true) => {
      const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, motDePasse }),
      });
      handleAuth(res.token, res.user, remember);
    },
    [handleAuth],
  );

  const register = useCallback(
    async (dto: RegisterInput, remember = true) => {
      const res = await api<{ token: string; user: AuthUser }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(dto) },
      );
      handleAuth(res.token, res.user, remember);
    },
    [handleAuth],
  );

  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

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
