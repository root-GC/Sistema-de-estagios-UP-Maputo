// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { get, post } from '../api/api';

// ── Tipos ────────────────────────────────────────────────────
export interface UserProfile {
  id: number;
  user_id?: number;
  student_number?: string;
  current_year?: number;
  course?: { id: number; name: string; code: string; duration_years: number };
  department?: { id: number; name: string };
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: string[];
  profile?: UserProfile;
}

export type AuthScreen = 'login' | 'register' | 'forgot' | 'reset-password';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  student_number: string;
  course_id: number;
  current_year: number;
}

interface AuthContextType {
  user: AuthUser | null;
  ready: boolean;
  authScreen: AuthScreen;
  setAuthScreen: (s: AuthScreen) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

// ── Context ──────────────────────────────────────────────────
const AuthCtx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [ready, setReady]             = useState(false);
  const [authScreen, setAuthScreen]   = useState<AuthScreen>('login');

  // Detecta token de reset na query string (?token=xxx&email=yyy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') && params.get('email')) {
      setAuthScreen('reset-password');
    }
  }, []);

  // Restaura sessão ao recarregar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setReady(true); return; }

    get<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setReady(true));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await post<{ token: string; user: AuthUser }>(
      '/auth/login', { email, password }
    );
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

//   const register = async (payload: RegisterPayload) => {
//     const data = await post<{ token: string; user: AuthUser }>(
//       '/auth/register', payload
//     );
//     localStorage.setItem('token', data.token);
//     setUser(data.user);
//   };

  const register = async (payload: RegisterPayload) => {
    await post('/auth/register', payload);       // a resposta { token, user } é ignorada
    // Mensagem de sucesso (podes usar um toast/estado global em vez do alert)
    alert('Conta criada com sucesso! Faça login para continuar.');
    setAuthScreen('login');                      // redirecciona para o ecrã de login
};

  const logout = async () => {
    await post('/auth/logout', {}).catch(() => {});
    localStorage.removeItem('token');
    setUser(null);
    setAuthScreen('login');
  };

  const hasRole = (...roles: string[]) =>
    user?.roles?.some(r => roles.includes(r)) ?? false;

  return (
    <AuthCtx.Provider value={{
      user, ready, authScreen, setAuthScreen,
      login, register, logout, hasRole,
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}