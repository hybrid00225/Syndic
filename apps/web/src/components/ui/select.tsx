'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = readonly [string, string];

// Select avec recherche (combobox). Remplace tous les <select> natifs.
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  className,
  disabled,
  allowEmpty,
  emptyLabel = '— Aucun —',
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const selected = options.find((o) => o[0] === value);
  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? options.filter((o) => o[1].toLowerCase().includes(needle))
    : options;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm transition',
          'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
          open && 'border-ring ring-2 ring-ring/30',
        )}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {selected ? selected[1] : allowEmpty && !value ? emptyLabel : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-[60] mt-1 w-full min-w-[12rem] overflow-hidden rounded-lg border border-border bg-card shadow-lift">
          <div className="flex items-center gap-2 border-b border-border px-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {allowEmpty && (
              <Row
                label={emptyLabel}
                active={!value}
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
              />
            )}
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Aucun résultat
              </p>
            )}
            {filtered.map((o) => (
              <Row
                key={o[0]}
                label={o[1]}
                active={o[0] === value}
                onClick={() => {
                  onChange(o[0]);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition hover:bg-muted',
        active && 'font-medium text-primary',
      )}
    >
      {label}
      {active && <Check className="h-4 w-4 shrink-0" />}
    </button>
  );
}
