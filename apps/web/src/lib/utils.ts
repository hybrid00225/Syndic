import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Les montants arrivent en chaîne (BigInt sérialisé). Format FCFA, sans décimale.
export function formatFCFA(montant: string | number | bigint): string {
  const n =
    typeof montant === 'bigint' ? Number(montant) : Number(montant ?? 0);
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
    .format(n)
    .concat(' FCFA');
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
