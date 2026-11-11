import { cn } from '@/lib/utils';

/**
 * Marque dessinée : un toit posé sur les lignes d'un registre
 * (la copropriété + la comptabilité), sans cartouche.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden className={cn('h-7 w-7', className)}>
      <path
        d="M3.5 12.5 14 4l10.5 8.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7.5 16h13M7.5 20h13M7.5 24h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// Lockup : marque + « Syndic Alpha » en Fraunces (Alpha en italique).
export function Wordmark({
  subtitle,
  className,
  size = 'md',
  onDark = false,
  compact = false,
}: {
  subtitle?: string;
  className?: string;
  size?: 'md' | 'lg';
  onDark?: boolean;
  /** Marque seule (sidebar repliée). */
  compact?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', onDark ? 'text-white' : 'text-foreground', className)}>
      <LogoMark className={cn(size === 'lg' ? 'h-8 w-8' : 'h-7 w-7', onDark ? 'text-white' : 'text-primary')} />
      {!compact && (
        <div className="leading-none">
          <div className={cn('font-display font-medium tracking-tight', size === 'lg' ? 'text-2xl' : 'text-lg')}>
            Syndic <span className={cn('italic', onDark ? 'text-white/70' : 'text-muted-foreground')}>Alpha</span>
          </div>
          {subtitle && (
            <div className={cn('mt-1 text-2xs', onDark ? 'text-white/55' : 'text-muted-foreground')}>{subtitle}</div>
          )}
        </div>
      )}
    </div>
  );
}
