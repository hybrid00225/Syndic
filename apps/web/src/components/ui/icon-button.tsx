import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

type Tone = 'neutral' | 'danger' | 'success';
type Size = 'xs' | 'sm' | 'md';

const tones: Record<Tone, string> = {
  neutral: 'hover:bg-muted hover:text-foreground',
  danger: 'hover:bg-danger/10 hover:text-danger',
  success: 'hover:bg-muted hover:text-success',
};

const sizes: Record<Size, { box: string; icon: string }> = {
  xs: { box: 'h-6 w-6 rounded-sm', icon: 'h-3.5 w-3.5' },
  sm: { box: 'h-8 w-8 rounded-md', icon: 'h-4 w-4' },
  md: { box: 'h-9 w-9 rounded-md', icon: 'h-4 w-4' },
};

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Libellé accessible (aria-label + infobulle native). Obligatoire. */
  label: string;
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  /** N'apparaît qu'au survol de la ligne parente (`group`) ou au focus clavier. */
  revealOnHover?: boolean;
  /** Infobulle stylée (côté) au lieu de l'infobulle native du navigateur. */
  tooltip?: 'top' | 'bottom' | 'left' | 'right';
  /** Taille d'icône personnalisée (ex. « h-[18px] w-[18px] »). */
  iconClassName?: string;
}

/** Bouton icône seul : actions de ligne, fermeture, suppression. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      icon: Icon,
      tone = 'neutral',
      size = 'md',
      revealOnHover,
      tooltip,
      iconClassName,
      className,
      type,
      title,
      ...props
    },
    ref,
  ) => {
    const btn = (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={tooltip ? undefined : (title ?? label)}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        sizes[size].box,
        tones[tone],
        revealOnHover && 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className={cn(sizes[size].icon, iconClassName)} />
    </button>
    );
    return tooltip ? (
      <Tooltip label={label} side={tooltip}>
        {btn}
      </Tooltip>
    ) : (
      btn
    );
  },
);
IconButton.displayName = 'IconButton';
