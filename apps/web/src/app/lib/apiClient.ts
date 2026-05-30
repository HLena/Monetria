export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5245/api';

const AUTH_STORAGE_KEY = 'auth-storage';

/** JWT para el header Authorization: prioriza auth_token y cae al persist de auth si hace falta */
export function getAuthToken(): string | null {
  const direct = localStorage.getItem('auth_token')?.trim();
  if (direct) return direct;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } };
    return parsed?.state?.accessToken?.trim() || null;
  } catch {
    return null;
  }
}

function parseErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const msg =
      (typeof o.message === 'string' && o.message) ||
      (typeof o.title === 'string' && o.title) ||
      (typeof o.detail === 'string' && o.detail) ||
      (typeof o.error === 'string' && o.error);
    if (msg) return msg;
  }
  if (status === 401) {
    return 'No autorizado. Verifica que hayas iniciado sesión y que el token sea válido.';
  }
  return `Error ${status}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const method = (options.method ?? 'GET').toUpperCase();
  const hasBody = options.body != null && options.body !== '';

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // GET/HEAD sin cuerpo: no enviar Content-Type (algunos hosts/API devuelven 401 si va presente)
  if (hasBody || ['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json';
  }

  const mergedHeaders = { ...headers, ...(options.headers as Record<string, string> | undefined) };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: mergedHeaders,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(parseErrorMessage(data, res.status));
  }
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get:    <T>(url: string)                => request<T>(url),
  post:   <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string)                => request<T>(url, { method: 'DELETE' }),
};