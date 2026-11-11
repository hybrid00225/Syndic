import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Les montants arrivent en chaîne (BigInt sérialisé), en entiers.
// La devise est propre à chaque copropriété (multi-devises) → on l'affiche telle quelle.
export function formatMontant(
  montant: string | number | bigint,
  devise?: string,
): string {
  const n =
    typeof montant === 'bigint' ? Number(montant) : Number(montant ?? 0);
  const base = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(n);
  return devise ? `${base} ${devise}` : base;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Libellés FR des statuts de copropriété (orthographe correcte).
export const STATUT_COPRO: Record<string, string> = {
  ACTIVE: 'Active',
  EN_CREATION: 'En création',
  INACTIVE: 'Inactive',
  CLOTUREE: 'Clôturée',
};
