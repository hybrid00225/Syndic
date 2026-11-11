import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const dots: Record<Tone, string> = {
  neutral: 'bg-muted-foreground/60',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  primary: 'bg-primary',
};

// Statut sobre : point coloré + texte encre, filet fin. Pas de fond pastel.
export function Badge({
  tone = 'neutral',
  dot = true,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-px text-2xs font-medium text-foreground',
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
}
