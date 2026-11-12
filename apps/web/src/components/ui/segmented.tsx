'use client';

import { cn } from '@/lib/utils';

/**
 * Choix exclusif court (2 à 4 options) sous forme de boutons accolés.
 * <Segmented value={v} onChange={setV} options={[['a', 'Option A'], ['b', 'Option B']]} />
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, React.ReactNode])[];
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-md border border-border bg-card p-0.5 text-ui', className)}
    >
      {options.map(([v, label]) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'rounded px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
