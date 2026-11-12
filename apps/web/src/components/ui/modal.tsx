'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './icon-button';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  /** Aperçu de document : quasi plein écran. */
  full: 'h-[calc(100dvh-2rem)] max-w-[1680px]',
} as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Boîte de dialogue modale (formulaires courts, aperçus).
 * Échap / clic sur le voile pour fermer, focus piégé dans la boîte puis rendu
 * à l'élément d'origine, défilement de la page bloqué.
 */
export function Modal({
  open = true,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  className,
  bodyClassName,
  children,
}: {
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Barre d'actions (boutons alignés à droite). */
  footer?: React.ReactNode;
  size?: keyof typeof sizes;
  className?: string;
  /** Classes du corps (ex. « p-0 » pour un contenu bord à bord). */
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const box = boxRef.current;
    // Premier champ du contenu (sinon la boîte elle-même).
    const first = box?.querySelector<HTMLElement>(
      '[data-modal-body] input:not([disabled]), [data-modal-body] textarea, [data-modal-body] select, [data-modal-body] button[role="combobox"]',
    );
    (first ?? box)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Laisser un combobox ouvert se fermer d'abord.
        if (e.defaultPrevented) return;
        e.preventDefault();
        onCloseRef.current();
      }
      if (e.key === 'Tab' && box) {
        const els = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null,
        );
        if (els.length === 0) return;
        const firstEl = els[0];
        const lastEl = els[els.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/30 p-4"
      onMouseDown={onClose}
    >
      <div
        ref={boxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        aria-describedby={description ? `${id}-d` : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'flex max-h-[calc(100vh-2rem)] w-full animate-pop-in flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lift outline-none',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={`${id}-t`} className="font-display text-xl font-medium leading-tight">
              {title}
            </h2>
            {description && (
              <p id={`${id}-d`} className="mt-1 text-ui text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Fermer" icon={X} onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        <div
          data-modal-body
          className={cn('flex-1 overflow-y-auto px-5 py-4 [&:has([data-modal-actions])]:pb-0', bodyClassName)}
        >
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Barre d'actions à placer en bas d'un formulaire dans une modale. */
export function ModalActions({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      data-modal-actions
      className={cn(
        'sticky bottom-0 -mx-5 mt-5 flex justify-end gap-2 border-t border-border bg-card px-5 py-3 shadow-[inset_0_0_0_9999px_hsl(var(--muted)/0.4)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
