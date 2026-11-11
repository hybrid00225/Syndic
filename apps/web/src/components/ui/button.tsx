import { cloneElement, forwardRef, isValidElement, ReactElement } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Rendre l'enfant (ex. un <Link>) stylé comme un bouton. */
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary:
    'bg-card text-foreground border border-border hover:bg-muted shadow-sm',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-sm rounded-lg',
};

const base =
  'inline-flex items-center justify-center gap-1.5 font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild, children, ...props }, ref) => {
    const cls = cn(base, variants[variant], sizes[size], className);
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: cn(cls, child.props.className),
      });
    }
    return (
      <button ref={ref} className={cls} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
