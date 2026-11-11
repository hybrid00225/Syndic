import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'info';

const accent: Record<Tone, string> = {
  primary: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  info: 'border-l-info',
};

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  filled?: boolean;
  onClick?: () => void;
  active?: boolean;
}

// KPI sobre : filet d'accent à gauche, chiffre en Fraunces, pas de lavis.
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  filled = false,
  onClick,
  active = false,
}: StatTileProps) {
  const cls = cn(
    'rounded-lg border border-border border-l-2 bg-card p-4 text-left transition-colors',
    accent[filled ? 'primary' : tone],
    onClick && 'cursor-pointer hover:bg-muted/40',
    active && 'ring-1 ring-primary',
  );
  const inner = (
    <>
      <div className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <div
        className={cn(
          'mt-2 font-display text-[1.9rem] font-semibold leading-none nums',
          filled ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 text-2xs text-muted-foreground">{hint}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
