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

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-input bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-danger text-white hover:bg-danger/90',
  link: 'h-auto px-0 text-primary underline-offset-4 hover:underline',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-ui',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-8 w-8',
};

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

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
