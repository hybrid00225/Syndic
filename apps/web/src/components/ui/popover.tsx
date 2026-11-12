'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Panneau flottant ancré à un déclencheur (menus de colonnes, d'export…).
 * Fermeture : clic extérieur, Échap (focus rendu au déclencheur).
 * `trigger` reçoit les props ARIA à poser sur le bouton.
 */
export function Popover({
  trigger,
  children,
  align = 'end',
  className,
}: {
  trigger: (props: {
    onClick: () => void;
    'aria-expanded': boolean;
    'aria-controls': string;
    'aria-haspopup': 'true';
  }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      ref.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-controls': id,
        'aria-haspopup': 'true',
      })}
      {open && (
        <div
          id={id}
          className={cn(
            'absolute top-full z-50 mt-1.5 min-w-[14rem] animate-pop-in overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lift',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
