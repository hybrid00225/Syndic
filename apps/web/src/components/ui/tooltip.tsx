'use client';

import { cloneElement, isValidElement, useId } from 'react';
import { cn } from '@/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

const sideCls: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

type A11yProps = { 'aria-label'?: string; 'aria-describedby'?: string };

/**
 * Infobulle (survol + focus clavier).
 * Accessibilité : si l'enfant n'a pas de nom (bouton icône), le libellé devient
 * son `aria-label` ; sinon il est relié en `aria-describedby`.
 */
export function Tooltip({
  label,
  side = 'top',
  children,
  className,
}: {
  label: React.ReactNode;
  side?: Side;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  let child = children;
  if (isValidElement<A11yProps>(children)) {
    const named = !!children.props['aria-label'];
    child = cloneElement(
      children,
      !named && typeof label === 'string'
        ? { 'aria-label': label }
        : { 'aria-describedby': id },
    );
  }

  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {child}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-[70] w-max max-w-[240px] rounded-md bg-foreground px-2 py-1 text-2xs font-medium text-background opacity-0 transition-opacity delay-150 duration-100 group-hover/tt:opacity-100 group-has-[:focus-visible]/tt:opacity-100',
          sideCls[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
