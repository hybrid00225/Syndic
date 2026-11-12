'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/*
 * « Retour » = page précédente DANS l'application. Si la page a été ouverte
 * directement (lien, favori, nouvel onglet), on va vers une page parente
 * plutôt que de quitter l'application.
 */

// Pages visitées dans l'onglet (pile). Un retour (bouton de l'app ou du
// navigateur) dépile ; toute autre navigation empile.
const visited: string[] = [];

/** À monter une fois (layout) : tient la pile des pages visitées. */
export function useNavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (visited.length > 1 && visited[visited.length - 2] === pathname) visited.pop();
    else if (visited[visited.length - 1] !== pathname) visited.push(pathname);
  }, [pathname]);
}

/** Action de retour : page précédente de l'application si elle existe, sinon `fallback`. */
export function useBack(fallback: string) {
  const router = useRouter();
  return () => {
    if (visited.length > 1) router.back();
    else router.push(fallback);
  };
}
