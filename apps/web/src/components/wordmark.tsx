import { cn } from '@/lib/utils';

// Logo lockup : badge vert à monogramme + nom (+ sous-titre optionnel).
export function Wordmark({
  subtitle,
  className,
  size = 'md',
  onDark = false,
}: {
  subtitle?: string;
  className?: string;
  size?: 'md' | 'lg';
  onDark?: boolean;
}) {
  const badge = size === 'lg' ? 'h-11 w-11 text-lg' : 'h-9 w-9 text-base';
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-xl font-semibold shadow-sm',
          onDark
            ? 'bg-emerald-500 text-emerald-950'
            : 'bg-primary text-primary-foreground',
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
            onDark && 'text-white',
          )}
        >
          Syndic Alpha
        </div>
        {subtitle && (
          <div
            className={cn(
              'text-xs',
              onDark ? 'text-emerald-100/70' : 'text-muted-foreground',
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
