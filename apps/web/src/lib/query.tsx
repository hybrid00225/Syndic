'use client';

import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useState } from 'react';
import { api, ApiError } from './api';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Pas de nouvel essai sur 4xx (404, 403…) : l'erreur est définitive.
            retry: (n, err) =>
              !(err instanceof ApiError && err.status < 500) && n < 2,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** GET typé sur l'API. La clé de cache = le chemin. */
export function useApi<T>(
  path: string | null,
  opts?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error>({
    queryKey: [path],
    queryFn: () => api<T>(path!),
    enabled: !!path && (opts?.enabled ?? true),
    ...opts,
  });
}

/**
 * Mutation (POST/PATCH/DELETE) qui invalide les listes concernées.
 * `invalidate` : préfixes de chemins à rafraîchir (ex. ['/coproprietes']).
 */
export function useApiMutation<TVars, TRes = unknown>(
  fn: (vars: TVars) => Promise<TRes>,
  invalidate: string[] = [],
) {
  const qc = useQueryClient();
  return useMutation<TRes, Error, TVars>({
    mutationFn: fn,
    onSuccess: () =>
      qc.invalidateQueries({
        predicate: (q) => {
          const key = String(q.queryKey[0] ?? '');
          return invalidate.some((p) => key.startsWith(p));
        },
      }),
  });
}

/** Invalidation manuelle (après un appel `api()` direct). */
export function useInvalidate() {
  const qc = useQueryClient();
  return (...prefixes: string[]) =>
    qc.invalidateQueries({
      predicate: (q) => {
        const key = String(q.queryKey[0] ?? '');
        return prefixes.some((p) => key.startsWith(p));
      },
    });
}

export function isNotFound(err: unknown) {
  return err instanceof ApiError && (err.status === 404 || err.status === 400);
}
