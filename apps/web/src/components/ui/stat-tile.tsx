import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'success' | 'warning' | 'info';

const toneCls: Record<Tone, { wash: string; chip: string }> = {
  primary: { wash: 'bg-primary/[0.04]', chip: 'bg-primary/10 text-primary' },
  success: { wash: 'bg-success/[0.05]', chip: 'bg-success/12 text-success' },
  warning: { wash: 'bg-warning/[0.06]', chip: 'bg-warning/15 text-warning' },
  info: { wash: 'bg-info/[0.05]', chip: 'bg-info/12 text-info' },
};

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  filled?: boolean;
}

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  hint,
  filled = false,
}: StatTileProps) {
  if (filled) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-transparent bg-gradient-to-br from-primary to-emerald-700 p-5 text-white shadow-soft">
        <div
          className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative flex items-center gap-2.5 text-sm text-white/80">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <Icon className="h-4 w-4" />
          </span>
          {label}
        </div>
        <div className="relative mt-3 text-3xl font-semibold tracking-tight nums">
          {value}
        </div>
        {hint && <div className="relative mt-1 text-xs text-white/60">{hint}</div>}
      </div>
    );
  }

  const c = toneCls[tone];
  return (
    <div
      className={cn(
        'rounded-xl border border-border p-5 shadow-soft',
        c.wash,
      )}
    >
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            c.chip,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight nums">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
