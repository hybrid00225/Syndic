'use client';

import { Tooltip } from './tooltip';
import { cn } from '@/lib/utils';

/**
 * Relevé de KPI — composé comme l'en-tête d'un état financier, pas comme
 * une grille de tuiles :
 *  - aucune boîte : les chiffres sont posés sur la page, entre un filet encre
 *    (haut) et un filet fin (bas), séparés par des filets verticaux ;
 *  - composition asymétrique : une cellule « lead » plus large porte le
 *    chiffre principal et sa visualisation propre (barre de composition,
 *    rangée d'unités) ;
 *  - pas d'icône, pas de pastille, pas de fond teinté.
 *
 * <Ledger>
 *   <Stat lead label="Copropriétés" value={12} viz={<Composition … />} />
 *   <Stat label="En exploitation" value={9} unit="/ 12" />
 * </Ledger>
 */
export function Ledger({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      aria-label="Indicateurs"
      className={cn(
        'grid grid-cols-2 gap-px border-y border-border border-t-foreground/80 bg-border',
        'lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]',
        className,
      )}
    >
      {children}
    </section>
  );
}

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
  onClick,
  active = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Unité ou dénominateur accolé (« / 12 », « m² »). */
  unit?: React.ReactNode;
  /** Note de bas de cellule (contexte, ventilation). */
  note?: React.ReactNode;
  /** Définition du chiffre — le libellé devient souligné en pointillé. */
  info?: string;
  tone?: Tone;
  /** Cellule principale (plus large, chiffre plus grand). */
  lead?: boolean;
  /** Visualisation propre au chiffre (Composition, Units…). */
  viz?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  const labelEl = info ? (
    <Tooltip label={info}>
      <span
        tabIndex={onClick ? -1 : 0}
        className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-[5px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {label}
      </span>
    </Tooltip>
  ) : (
    label
  );

  const body = (
    <>
      <span className="flex items-center justify-between gap-2 text-ui text-muted-foreground">
        <span className={cn(active && 'text-foreground')}>{labelEl}</span>
        {onClick && (
          <span
            aria-hidden
            className={cn(
              'text-2xs transition-opacity',
              active ? 'text-foreground opacity-100' : 'opacity-0 group-hover/stat:opacity-100',
            )}
          >
            {active ? 'filtre actif' : 'filtrer'}
          </span>
        )}
      </span>

      <span className={cn('flex items-baseline gap-2', lead ? 'mt-3' : 'mt-2.5')}>
        <span
          className={cn(
            'nums font-display font-normal leading-[0.9]',
            lead ? 'text-[3.25rem]' : 'text-[2.25rem]',
            tone === 'danger' && 'text-danger',
            tone === 'warning' && 'text-warning',
          )}
        >
          {value}
        </span>
        {unit && <span className="nums font-display text-lg italic text-muted-foreground">{unit}</span>}
      </span>

      {viz && <span className="mt-4 block">{viz}</span>}
      {note && <span className="mt-2.5 block text-2xs leading-relaxed text-muted-foreground">{note}</span>}
    </>
  );

  const cls = cn(
    'group/stat relative flex flex-col bg-background px-5 py-5 text-left',
    lead && 'col-span-2 lg:col-span-1 lg:pr-8',
    active && 'bg-card shadow-[inset_0_-2px_0_0_hsl(var(--foreground))]',
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          cls,
          'transition-colors hover:bg-card focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

// ------------------------------------------------------------------
// Visualisations propres aux chiffres
// ------------------------------------------------------------------

export type Segment = {
  label: string;
  value: number;
  /** ink = encre pleine · soft = encre atténuée · warn = ocre · empty = vide */
  tone: 'ink' | 'soft' | 'warn' | 'danger' | 'empty';
};

const segBg: Record<Segment['tone'], string> = {
  ink: 'bg-foreground',
  soft: 'bg-foreground/35',
  warn: 'bg-warning',
  danger: 'bg-danger',
  empty: 'bg-border',
};

/** Barre de composition segmentée + légende chiffrée. */
export function Composition({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  return (
    <span className="block">
      <span
        role="img"
        aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(', ')}
        className="flex h-1.5 w-full gap-[3px]"
      >
        {total === 0 ? (
          <span className="h-full flex-1 rounded-[1px] bg-border" />
        ) : (
          visible.map((s) => (
            <span
              key={s.label}
              className={cn('h-full rounded-[1px]', segBg[s.tone])}
              style={{ flexGrow: s.value, flexBasis: 0 }}
            />
          ))
        )}
      </span>
      <span className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn('h-2 w-2 rounded-[1px]', segBg[s.tone])} />
            {s.label}
            <span className="nums text-foreground">{s.value}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Rangée d'unités : un trait par élément (lot, copropriété…).
 * Lisible jusqu'à ~60 éléments ; au-delà, bascule sur Composition.
 */
export function Units({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total > 60) return <Composition segments={segments} />;
  const ticks = segments.flatMap((s) => Array.from({ length: s.value }, () => s.tone));
  return (
    <span
      role="img"
      aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(', ')}
      className="flex h-5 items-end gap-[3px]"
    >
      {ticks.length === 0 ? (
        <span className="h-px w-full bg-border" />
      ) : (
        ticks.map((t, i) => <span key={i} className={cn('h-full w-[3px] rounded-full', segBg[t])} />)
      )}
    </span>
  );
}
