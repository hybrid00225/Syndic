'use client';

import { cn } from '@/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

const sideCls: Record<Side, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

// Infobulle légère (hover + focus). À mettre sur TOUS les boutons icône et les widgets.
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
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-[70] max-w-[220px] whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          sideCls[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}
