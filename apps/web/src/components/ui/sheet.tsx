'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

/**
 * Panneau latéral (aperçu rapide). Échap ou clic extérieur pour fermer,
 * focus déplacé dans le panneau puis rendu à l'élément d'origine.
 */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-foreground/20" onMouseDown={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md animate-sheet-in flex-col border-l border-border bg-card shadow-lift outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
          <div>
            {eyebrow && <p className="text-2xs text-muted-foreground">{eyebrow}</p>}
            <h2 id={`${id}-t`} className="font-display text-2xl font-medium leading-tight">
              {title}
            </h2>
          </div>
          <IconButton label="Fermer" icon={X} size="sm" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Liste « libellé — valeur » pour les aperçus et fiches. */
export function DefList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-border text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
