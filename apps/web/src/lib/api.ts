// Client API minimal : injecte le token, gère les erreurs.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'syndic_alpha_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message ?? message;
    } catch {
      /* corps non JSON */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
