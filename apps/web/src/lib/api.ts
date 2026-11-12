// Client API minimal : injecte le token, gère les erreurs.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3013';

const TOKEN_KEY = 'syndic_alpha_token';

/** Événement émis quand la session n'est plus valide (jeton expiré/révoqué). */
export const SESSION_EXPIRED_EVENT = 'syndic-alpha:session-expiree';

/** Date d'expiration (ms) lue dans le JWT — sans vérifier la signature (rôle du serveur). */
function expiration(token: string): number | null {
  try {
    const part = token.split('.')[1];
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token =
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  // Jeton malformé ou expiré : on le purge plutôt que de l'envoyer.
  const exp = expiration(token);
  if (exp === null || exp <= Date.now()) {
    clearToken();
    return null;
  }
  return token;
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

// Appel réseau : une panne (serveur arrêté, hors ligne, CORS) devient une
// erreur lisible plutôt que « Failed to fetch ».
async function joindre(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, credentials: 'omit' });
  } catch {
    throw new ApiError(
      0,
      'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.',
    );
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
  const res = await joindre(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && token) {
    // Session expirée ou révoquée : on déconnecte proprement.
    clearToken();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!res.ok) {
    let message =
      res.status === 429
        ? 'Trop de tentatives. Patientez quelques instants avant de réessayer.'
        : `Erreur ${res.status}`;
    if (res.status !== 429) {
      try {
        const body = await res.json();
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message ?? message;
      } catch {
        /* corps non JSON */
      }
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Récupère une ressource binaire (fichier) en envoyant le token d'auth.
export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const res = await joindre(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  if (!res.ok) {
    throw new ApiError(res.status, `Erreur ${res.status}`);
  }
  return res.blob();
}

// Types affichables sans risque dans l'aperçu (jamais HTML/SVG/XML : un blob:
// hérite de l'origine de l'application et pourrait exécuter du script).
const INLINE_SAFE = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']);

/**
 * Récupère un document téléversé (protégé) pour l'aperçu ou le téléchargement.
 * Le type MIME est revérifié côté client : tout ce qui n'est pas sûr devient
 * un binaire opaque, proposé au téléchargement uniquement.
 */
export async function fetchDocument(path: string, filename = 'document') {
  const raw = await apiBlob(path);
  const type = raw.type.split(';')[0].trim().toLowerCase();
  return {
    blob: new Blob([raw], { type: INLINE_SAFE.has(type) ? type : 'application/octet-stream' }),
    filename: filename.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_'),
  };
}
