'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabItem<K extends string> {
  key: K;
  label: React.ReactNode;
  icon?: LucideIcon;
  /** Compteur affiché à droite du libellé. */
  count?: number;
}

/**
 * Onglets soulignés (navigation de section). Clavier : ← → Début Fin.
 * Trop d'onglets pour la largeur : défilement horizontal sans barre visible,
 * avec un fondu + une flèche du côté où il reste des onglets.
 */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  items: readonly TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  className?: string;
  'aria-label'?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [overflow, setOverflow] = useState({ start: false, end: false });

  // Côtés où des onglets sont masqués (au défilement et au redimensionnement).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () =>
      setOverflow({
        start: el.scrollLeft > 1,
        end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [items.length]);

  // L'onglet actif reste visible (ex. ouvert depuis l'URL) — défilement horizontal
  // de la barre uniquement, jamais de la page.
  useEffect(() => {
    const el = listRef.current;
    const tab = refs.current[items.findIndex((t) => t.key === value)];
    if (!el || !tab) return;
    const pad = 48; // place pour l'indicateur de bord
    if (tab.offsetLeft < el.scrollLeft + pad) el.scrollLeft = tab.offsetLeft - pad;
    else if (tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth - pad) {
      el.scrollLeft = tab.offsetLeft + tab.offsetWidth - el.clientWidth + pad;
    }
  }, [value, items]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next].key);
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = listRef.current;
    el?.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: 'smooth' });
  };

  return (
    <div className={cn('relative border-b border-border', className)}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        // `relative` : référence des offsetLeft des onglets (positions dans la zone défilante).
        className="relative flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t, i) => {
          const Icon = t.icon;
          const active = t.key === value;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(t.key)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                // Soulignement de l'onglet actif dessiné dans le bouton (pas de marge négative).
                'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                active
                  ? 'text-foreground after:bg-primary'
                  : 'text-muted-foreground after:bg-transparent hover:text-foreground',
              )}
            >
              {Icon && <Icon aria-hidden className="h-4 w-4" />}
              {t.label}
              {t.count !== undefined && (
                <span className="nums rounded-full bg-muted px-1.5 text-2xs text-muted-foreground">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Indicateurs « encore des onglets » (souris ; clavier et tactile défilent directement). */}
      {overflow.start && <EdgeButton side="start" onClick={() => scrollBy(-1)} />}
      {overflow.end && <EdgeButton side="end" onClick={() => scrollBy(1)} />}
    </div>
  );
}

function EdgeButton({ side, onClick }: { side: 'start' | 'end'; onClick: () => void }) {
  const Icon = side === 'start' ? ChevronLeft : ChevronRight;
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-y-0 flex w-16 items-center from-background via-background/90 to-transparent',
        side === 'start' ? 'left-0 justify-start bg-gradient-to-r' : 'right-0 justify-end bg-gradient-to-l',
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClick}
        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
