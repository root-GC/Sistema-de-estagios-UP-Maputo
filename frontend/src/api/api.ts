// src/api/api.ts

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

export async function api<T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Sessão expirada');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data as ApiError;
  return data as T;
}

export const get   = <T = any>(p: string)               => api<T>('GET', p);
export const post  = <T = any>(p: string, b: unknown)   => api<T>('POST', p, b);
export const patch = <T = any>(p: string, b: unknown)   => api<T>('PATCH', p, b);
export const put   = <T = any>(p: string, b: unknown)   => api<T>('PUT', p, b);
export const del   = <T = any>(p: string)                => api<T>('DELETE', p);