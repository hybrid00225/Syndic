// Client API minimal : injecte le token, gère les erreurs.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'syndic_alpha_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

// remember=true → persiste (localStorage) ; sinon session seule (sessionStorage).
export function setToken(token: string, remember = true) {
  clearToken();
  if (remember) window.localStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
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
  // Pour un upload (FormData), on laisse le navigateur poser le Content-Type
  // multipart (avec la frontière) ; sinon JSON par défaut.
  const isForm =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
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

// Récupère une ressource binaire (fichier) en envoyant le token d'auth.
export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new ApiError(res.status, `Erreur ${res.status}`);
  }
  return res.blob();
}
