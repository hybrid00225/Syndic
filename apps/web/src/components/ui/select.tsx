'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFieldId } from './input';

type Option = readonly [string, string];

/** Au-delà de ce nombre d'options, un champ de recherche apparaît. */
const SEARCH_THRESHOLD = 7;

/**
 * Select (combobox ARIA) : clavier complet (↑ ↓ Début Fin Entrée Échap),
 * recherche automatique quand la liste est longue.
 */
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
  id: idProp,
  'aria-label': ariaLabel,
  size = 'md',
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
  id?: string;
  'aria-label'?: string;
  size?: 'sm' | 'md';
}) {
  const autoId = useId();
  const fieldId = useFieldId();
  const id = idProp ?? fieldId ?? autoId;
  const listId = `${id}-list`;

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const all: Option[] = allowEmpty ? [['', emptyLabel], ...options] : [...options];
  const needle = q.trim().toLowerCase();
  const filtered = needle ? all.filter((o) => o[1].toLowerCase().includes(needle)) : all;
  const searchable = options.length > SEARCH_THRESHOLD;
  const selected = all.find((o) => o[0] === value);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(Math.max(0, all.findIndex((o) => o[0] === value)));
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[active]) pick(filtered[active][0]);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-left transition-colors hover:border-foreground/30',
          'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-9 text-ui' : 'h-10 text-sm',
          open && 'border-primary ring-1 ring-primary',
        )}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {selected ? selected[1] : placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-[60] mt-1 w-full min-w-[12rem] animate-pop-in overflow-hidden rounded-md border border-border bg-card shadow-lift">
          {searchable && (
            <div className="flex items-center gap-2 border-b border-border px-2.5">
              <Search aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${id}-o${active}` : undefined}
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          )}
          <div ref={listRef} id={listId} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">Aucun résultat.</p>
            )}
            {filtered.map((o, i) => {
              const isSel = o[0] === value;
              return (
                <div
                  key={o[0] || '__empty'}
                  id={`${id}-o${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(o[0])}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-sm',
                    i === active && 'bg-muted',
                    isSel && 'font-medium',
                    o[0] === '' && 'text-muted-foreground',
                  )}
                >
                  {o[1]}
                  {isSel && <Check aria-hidden className="h-4 w-4 shrink-0 text-primary" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
