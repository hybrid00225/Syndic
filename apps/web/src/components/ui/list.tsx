'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react';
import { Tooltip } from './tooltip';
import { Button } from './button';
import { cn } from '@/lib/utils';

// ---------- Champ de recherche ----------
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-ui placeholder:text-muted-foreground/70 hover:border-foreground/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      />
    </div>
  );
}

// ---------- Bascule de vue (soulignée, pas de pilule grise) ----------
export type View = 'table' | 'cards';

export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const opts: [View, string][] = [
    ['table', 'Tableau'],
    ['cards', 'Cartes'],
  ];
  return (
    <div role="tablist" aria-label="Affichage" className="flex items-center gap-4 text-ui">
      {opts.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={view === v}
          onClick={() => onChange(v)}
          className={cn(
            'relative py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            view === v
              ? 'text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------- Barre de filtres ----------
export function ListToolbar({
  search,
  children,
  hasFilters,
  onReset,
  count,
  view,
  onViewChange,
}: {
  search: React.ReactNode;
  children?: React.ReactNode;
  hasFilters?: boolean;
  onReset?: () => void;
  count: number;
  view?: View;
  onViewChange?: (v: View) => void;
}) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <div className="min-w-[220px] flex-1">{search}</div>
      {children}
      {hasFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Réinitialiser
        </Button>
      )}
      <div className="ml-auto flex items-center gap-5">
        <span className="nums text-ui text-muted-foreground" aria-live="polite">
          {count} résultat{count > 1 ? 's' : ''}
        </span>
        {view && onViewChange && <ViewToggle view={view} onChange={onViewChange} />}
      </div>
    </div>
  );
}

// ---------- Pagination client ----------
export const PAGE_SIZES = [10, 25, 50] as const;

export function usePaged<T>(items: T[], initialSize: number, resetKey: unknown) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  useEffect(() => setPage(1), [resetKey, pageSize]);
  const total = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, total);
  const start = (current - 1) * pageSize;
  const pageItems = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);
  return { page: current, setPage, total, start, pageItems, count: items.length, pageSize, setPageSize };
}

/** Pagination toujours visible (s'intègre dans le pied de <Table footer>). */
export function Pagination({
  page,
  total,
  start,
  count,
  pageSize,
  setPage,
  setPageSize,
}: ReturnType<typeof usePaged<unknown>>) {
  if (count === 0) return null;
  const btn =
    'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
  // Numéros de page compacts : 1 … 4 5 6 … 12
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <nav aria-label="Pagination" className="no-print flex flex-wrap items-center justify-between gap-3 text-ui">
      <div className="flex items-center gap-4 text-muted-foreground">
        <span className="nums">
          <span className="text-foreground">{start + 1}–{Math.min(start + pageSize, count)}</span> sur {count}
        </span>
        <label className="flex items-center gap-2">
          Lignes par page
          <span className="flex">
            {PAGE_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPageSize(n)}
                aria-pressed={pageSize === n}
                className={cn(
                  'nums h-7 min-w-8 rounded-md px-1.5 transition-colors',
                  pageSize === n ? 'bg-foreground text-background' : 'hover:bg-muted hover:text-foreground',
                )}
              >
                {n}
              </button>
            ))}
          </span>
        </label>
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" className={btn} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'nums h-8 min-w-8 rounded-md px-2 transition-colors',
                p === page ? 'bg-foreground font-medium text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={btn} disabled={page === total} onClick={() => setPage(page + 1)} aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

// ---------- Actions de ligne (icônes + infobulle + nom accessible) ----------
const actionCls =
  'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function RowAction({
  label,
  icon: Icon,
  href,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const cls = cn(actionCls, danger && 'hover:bg-danger/10 hover:text-danger');
  return (
    <Tooltip label={label}>
      {href ? (
        <Link href={href} className={cls} aria-label={label}>
          <Icon className="h-4 w-4" />
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cls} aria-label={label}>
          <Icon className="h-4 w-4" />
        </button>
      )}
    </Tooltip>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="no-print flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
      {children}
    </div>
  );
}
