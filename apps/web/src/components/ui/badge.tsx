import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const tones: Record<Tone, { chip: string; dot: string }> = {
  neutral: { chip: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  success: { chip: 'bg-success/12 text-success', dot: 'bg-success' },
  warning: { chip: 'bg-warning/15 text-warning', dot: 'bg-warning' },
  danger: { chip: 'bg-danger/12 text-danger', dot: 'bg-danger' },
  info: { chip: 'bg-info/12 text-info', dot: 'bg-info' },
  primary: { chip: 'bg-primary/12 text-primary', dot: 'bg-primary' },
};

export function Badge({
  tone = 'neutral',
  dot = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone].chip,
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', tones[tone].dot)} />
      )}
      {children}
    </span>
  );
}
