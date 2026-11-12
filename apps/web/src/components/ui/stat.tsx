'use client';

import { createContext, useContext } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Tooltip } from './tooltip';
import { cn } from '@/lib/utils';

/**
 * Widgets KPI.
 *  - Une carte « lead » en vert forêt plein (pas de dégradé) porte le chiffre
 *    principal et sa répartition.
 *  - Les autres sont des cartes compactes : libellé, gros chiffre en Fraunces,
 *    visualisation propre au chiffre à droite (anneau, jetons…), et une action.
 *  - Pas d'icône décorative, pas de fond pastel.
 */
export function Ledger({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      aria-label="Indicateurs"
      className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]', className)}
    >
      {children}
    </section>
  );
}

const DarkCtx = createContext(false);

type Tone = 'default' | 'danger' | 'warning';

export function Stat({
  label,
  value,
  unit,
  note,
  info,
  tone = 'default',
  lead = false,
  viz,
  aside,
  action,
  onClick,
  active = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Unité ou dénominateur accolé (« / 12 »). */
  unit?: React.ReactNode;
  /** Ligne de contexte sous le chiffre. */
  note?: React.ReactNode;
  /** Définition du chiffre (infobulle sur le libellé souligné). */
  info?: string;
  tone?: Tone;
  /** Carte principale, pleine, plus large. */
  lead?: boolean;
  /** Visualisation pleine largeur sous le chiffre (Composition). */
  viz?: React.ReactNode;
  /** Visualisation compacte à droite du chiffre (Ring, Tokens). */
  aside?: React.ReactNode;
  /** Lien d'action en pied de carte. */
  action?: { label: string; href?: string; onClick?: () => void };
  onClick?: () => void;
  active?: boolean;
}) {
  const labelEl = info ? (
    <Tooltip label={info}>
      <span
        tabIndex={onClick ? -1 : 0}
        className="cursor-help underline decoration-dotted decoration-current/40 underline-offset-[5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {label}
      </span>
    </Tooltip>
  ) : (
    label
  );

  const muted = lead ? 'text-primary-foreground/70' : 'text-muted-foreground';

  const body = (
    <DarkCtx.Provider value={lead}>
      <span className={cn('flex items-start justify-between gap-2 text-ui font-medium', muted)}>
        <span>{labelEl}</span>
        {onClick && (
          <span
            aria-hidden
            className={cn(
              'rounded-full px-2 py-px text-2xs font-medium transition-opacity',
              active
                ? lead
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-foreground text-background'
                : cn('opacity-0 group-hover/stat:opacity-100', lead ? 'bg-primary-foreground/15' : 'bg-muted text-foreground'),
            )}
          >
            {active ? 'Filtre actif' : 'Filtrer'}
          </span>
        )}
      </span>

      <span className="mt-1.5 flex items-end justify-between gap-3">
        <span className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'nums font-display font-medium leading-none tracking-tight',
              lead ? 'text-[1.875rem]' : 'text-[1.625rem]',
              tone === 'danger' && 'text-danger',
              tone === 'warning' && 'text-warning',
            )}
          >
            {value}
          </span>
          {unit && (
            <span className={cn('nums font-display text-base', lead ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
              {unit}
            </span>
          )}
        </span>
        {aside}
      </span>

      {viz && <span className="mt-2.5 block">{viz}</span>}

      {(note || action) && (
        <span
          className={cn(
            'mt-auto flex items-center justify-between gap-2 pt-2 text-2xs',
            muted,
          )}
        >
          <span>{note}</span>
          {action &&
            (action.href ? (
              <Link
                href={action.href}
                onClick={(e) => e.stopPropagation()}
                className={cn('inline-flex shrink-0 items-center gap-1 font-medium hover:underline underline-offset-4', lead ? 'text-primary-foreground' : 'text-primary')}
              >
                {action.label} <ArrowRight aria-hidden className="h-3 w-3" />
              </Link>
            ) : null)}
        </span>
      )}
    </DarkCtx.Provider>
  );

  const cls = cn(
    'group/stat relative flex flex-col rounded-lg border px-4 py-3 text-left transition-[border-color,box-shadow,background-color]',
    lead
      ? 'border-primary bg-primary text-primary-foreground sm:col-span-2 xl:col-span-1'
      : 'border-border bg-card shadow-soft',
    active && !lead && 'border-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground))]',
    active && lead && 'shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_4px_hsl(var(--primary))]',
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          cls,
          !lead && !active && 'hover:border-foreground/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

// ------------------------------------------------------------------
// Visualisations
// ------------------------------------------------------------------

export type Segment = {
  label: string;
  value: number;
  tone: 'ink' | 'soft' | 'warn' | 'danger' | 'empty';
};

function segClass(tone: Segment['tone'], dark: boolean) {
  if (dark) {
    return {
      ink: 'bg-primary-foreground',
      soft: 'bg-primary-foreground/45',
      warn: 'bg-[hsl(38_85%_62%)]',
      danger: 'bg-[hsl(6_80%_70%)]',
      empty: 'bg-primary-foreground/15',
    }[tone];
  }
  return {
    ink: 'bg-primary',
    soft: 'bg-primary/40',
    warn: 'bg-warning',
    danger: 'bg-danger',
    empty: 'bg-muted',
  }[tone];
}

/** Barre de répartition épaisse + légende chiffrée. */
export function Composition({ segments }: { segments: Segment[] }) {
  const dark = useContext(DarkCtx);
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <span className="block">
      <span
        role="img"
        aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(', ')}
        className="flex h-1.5 w-full gap-[3px] overflow-hidden"
      >
        {total === 0 ? (
          <span className={cn('h-full flex-1 rounded-sm', segClass('empty', dark))} />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <span
                key={s.label}
                className={cn('h-full rounded-sm', segClass(s.tone, dark))}
                style={{ flexGrow: s.value, flexBasis: 0 }}
              />
            ))
        )}
      </span>
      <span className={cn('mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-2xs', dark ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-[2px]', segClass(s.tone, dark))} />
            <span>{s.label}</span>
            <span className={cn('nums font-semibold', dark ? 'text-primary-foreground' : 'text-foreground')}>
              {s.value}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

/** Anneau de ratio (0–1) avec pourcentage au centre. */
export function Ring({ value, tone = 'ink' }: { value: number; tone?: 'ink' | 'warn' | 'danger' }) {
  const v = Math.max(0, Math.min(1, value));
  const r = 20;
  const c = 2 * Math.PI * r;
  const stroke = { ink: 'stroke-primary', warn: 'stroke-warning', danger: 'stroke-danger' }[tone];
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center" role="img" aria-label={`${Math.round(v * 100)} %`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${v * c} ${c}`}
          className={cn(stroke, 'transition-[stroke-dasharray] duration-700')}
        />
      </svg>
      <span className="nums text-[0.625rem] font-semibold">{Math.round(v * 100)}%</span>
    </span>
  );
}

/** Jetons (codes devise, pays…). */
export function Tokens({ items }: { items: string[] }) {
  return (
    <span className="flex max-w-[60%] flex-wrap justify-end gap-1">
      {items.map((t) => (
        <span key={t} className="nums rounded-sm border border-border bg-background px-1.5 py-0.5 text-2xs font-semibold tracking-wide">
          {t}
        </span>
      ))}
    </span>
  );
}
