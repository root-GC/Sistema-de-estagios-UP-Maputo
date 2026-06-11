// src/api/api.ts

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const STORAGE_BASE = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000';  // base do storage

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

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
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

// Função auxiliar para construir URLs absolutas para ficheiros do storage
export function storageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${STORAGE_BASE}${normalizedPath}`;
}

export const get   = <T = any>(p: string)               => api<T>('GET', p);
export const post  = <T = any>(p: string, b: unknown)   => api<T>('POST', p, b);
export const patch = <T = any>(p: string, b: unknown)   => api<T>('PATCH', p, b);
export const put   = <T = any>(p: string, b: unknown)   => api<T>('PUT', p, b);
export const del   = <T = any>(p: string)                => api<T>('DELETE', p);