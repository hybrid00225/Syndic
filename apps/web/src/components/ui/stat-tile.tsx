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
  onClick?: () => void;
  active?: boolean;
}

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
  const clickable = !!onClick;

  const content = filled ? (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[2rem] font-bold leading-none tracking-tight nums">
          {value}
        </div>
        <div className="mt-1 text-sm text-white/80">{label}</div>
      </div>
    </>
  ) : (
    <>
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          toneCls[tone].chip,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-[2rem] font-bold leading-none tracking-tight nums">
          {value}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          {label}
          {hint && <span className="text-xs text-muted-foreground/70">· {hint}</span>}
        </div>
      </div>
    </>
  );

  const cls = cn(
    'flex items-center gap-4 rounded-xl border p-4 text-left transition',
    filled
      ? 'border-transparent bg-gradient-to-br from-primary to-emerald-700 text-white shadow-soft'
      : cn('border-border', toneCls[tone].wash),
    clickable && 'hover:shadow-soft cursor-pointer',
    active && !filled && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
  );

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {content}
      </button>
    );
  }
  return <div className={cls}>{content}</div>;
}
