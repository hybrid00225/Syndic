'use client';

import { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Libellé visible à droite de la case (sinon fournir aria-label). */
  label?: React.ReactNode;
}

/** Case à cocher native (accessible, clavier) au style du design system. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id: idProp, disabled, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const box = (
      <span className="relative inline-flex h-4 w-4 shrink-0">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          disabled={disabled}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-input bg-card transition-colors checked:border-primary checked:bg-primary hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
        />
      </span>
    );
    if (!label) return <span className={cn('inline-flex', className)}>{box}</span>;
    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex cursor-pointer select-none items-center gap-2 text-sm text-foreground',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
      >
        {box}
        {label}
      </label>
    );
  },
);
Checkbox.displayName = 'Checkbox';
