import { cn } from '@/lib/utils';

// Logo lockup : badge vert à monogramme + nom (+ sous-titre optionnel).
export function Wordmark({
  subtitle,
  className,
  size = 'md',
}: {
  subtitle?: string;
  className?: string;
  size?: 'md' | 'lg';
}) {
  const badge = size === 'lg' ? 'h-11 w-11 text-lg' : 'h-9 w-9 text-base';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm',
          badge,
        )}
      >
        S
      </div>
      <div className="leading-tight">
        <div
          className={cn(
            'font-semibold tracking-tight',
            size === 'lg' ? 'text-lg' : 'text-[15px]',
          )}
        >
          Syndic Alpha
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
