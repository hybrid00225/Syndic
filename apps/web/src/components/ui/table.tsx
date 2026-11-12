'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Tableau registre : filets horizontaux uniquement, en-têtes en casse normale,
 * chiffres à droite, lignes cliquables, pied (pagination) intégré.
 */
export function Table({
  className,
  footer,
  children,
}: {
  className?: string;
  /** Pied du tableau (pagination, totaux). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
      {footer && <div className="border-t border-border bg-background/60 px-4 py-2.5">{footer}</div>}
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-background/60">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-border px-4 py-3 text-left text-ui font-medium text-muted-foreground first:pl-5 last:pr-5',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Ligne. Avec `href`, toute la ligne est cliquable (Ctrl/⌘ + clic = nouvel onglet).
 * Les éléments interactifs internes (liens, boutons) gardent leur propre action.
 * Accessibilité : la cellule principale doit contenir un vrai <Link> vers la même cible.
 */
export function Tr({
  className,
  href,
  onOpen,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & {
  href?: string;
  /** Action au clic sur la ligne quand il n'y a pas de page cible (ex. aperçu). */
  onOpen?: () => void;
}) {
  const router = useRouter();
  const clickable = !!(href || onOpen);
  const onClick = clickable
    ? (e: React.MouseEvent<HTMLTableRowElement>) => {
        if ((e.target as HTMLElement).closest('a,button,input,select,textarea,[role="combobox"]')) return;
        if (window.getSelection()?.toString()) return; // sélection de texte en cours
        if (onOpen) return onOpen();
        if (e.metaKey || e.ctrlKey) window.open(href, '_blank');
        else router.push(href!);
      }
    : undefined;
  return (
    <tr
      onClick={onClick}
      className={cn(
        'group/row border-b border-border transition-colors last:border-b-0',
        clickable ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/30',
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn('px-4 py-3.5 align-middle first:pl-5 last:pr-5', numeric && 'nums text-right', className)}
      {...props}
    />
  );
}
