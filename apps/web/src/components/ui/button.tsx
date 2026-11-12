import { cloneElement, forwardRef, isValidElement, ReactElement } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Rendre l'enfant (ex. un <Link>) stylé comme un bouton. */
  asChild?: boolean;
}

// Relief discret : liseré clair en haut + ombre portée fine (bouton « physique »).
const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.18)] hover:bg-primary/90 active:translate-y-px',
  secondary:
    'border border-input bg-card text-foreground shadow-[0_1px_2px_rgb(40_30_20/0.06)] hover:border-foreground/30 hover:bg-background active:translate-y-px',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-danger text-white hover:bg-danger/90',
  link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-ui gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[0.9375rem] gap-2',
  icon: 'h-9 w-9',
};

const base =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, type, children, ...props }, ref) => {
    const cls = cn(base, variants[variant], variant !== 'link' && sizes[size], className);
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, { className: cn(cls, child.props.className) });
    }
    return (
      <button ref={ref} type={type ?? 'button'} className={cls} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
