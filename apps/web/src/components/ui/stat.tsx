import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

/**
 * Bandeau de KPI façon « grand livre » : cellules séparées par des filets,
 * chiffre en Fraunces, pas d'icône décorative, pas de fond teinté.
 * <Stats><Stat label="Lots" value={12} /> …</Stats>
 */
export function Stats({
  className,
  cols = 4,
  children,
}: {
  className?: string;
  cols?: 2 | 3 | 4 | 5;
  children: React.ReactNode;
}) {
  const grid = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 xl:grid-cols-4',
    5: 'sm:grid-cols-3 xl:grid-cols-5',
  }[cols];
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border',
        grid,
        className,
      )}
    >
      {children}
    </div>
  );
}

type Tone = 'default' | 'danger' | 'warning' | 'success';

const valueTone: Record<Tone, string> = {
  default: 'text-foreground',
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
};

export function Stat({
  label,
  value,
  unit,
  hint,
  info,
  tone = 'default',
  progress,
  onClick,
  active = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Petite unité accolée au chiffre (ex. « / 12 », « m² »). */
  unit?: React.ReactNode;
  hint?: React.ReactNode;
  /** Explication du widget (infobulle). */
  info?: string;
  tone?: Tone;
  /** Ratio 0–1 : affiche une jauge fine. */
  progress?: number;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <>
      {active && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
      <span className="flex items-center gap-1.5 text-ui text-muted-foreground">
        <span className={cn(active && 'font-medium text-foreground')}>{label}</span>
        {info && (
          <Tooltip label={info}>
            <span tabIndex={0} aria-label={info} className="inline-flex cursor-help rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <Info aria-hidden className="h-3.5 w-3.5 opacity-60" />
            </span>
          </Tooltip>
        )}
      </span>
      <span className="mt-2 flex items-baseline gap-1.5">
        <span className={cn('nums font-display text-[2rem] font-medium leading-none', valueTone[tone])}>
          {value}
        </span>
        {unit && <span className="nums text-sm text-muted-foreground">{unit}</span>}
      </span>
      {progress !== undefined && (
        <span aria-hidden className="mt-3 block h-[3px] w-full overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-foreground/80"
            style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
          />
        </span>
      )}
      {hint && <span className="mt-2 block text-2xs text-muted-foreground">{hint}</span>}
    </>
  );

  const cls = 'relative flex flex-col bg-card px-5 py-4 text-left';
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          cls,
          'transition-colors hover:bg-muted/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
