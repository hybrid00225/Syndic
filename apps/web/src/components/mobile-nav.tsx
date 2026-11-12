'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

/** Tiroir de navigation des petits écrans (ouvert depuis le bouton ☰ de la barre du haut). */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Fermeture au changement de page.
  useEffect(() => {
    onCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
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
    <div className="fixed inset-0 z-[80] flex bg-foreground/30 lg:hidden" onMouseDown={onClose}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        onMouseDown={(e) => e.stopPropagation()}
        className="h-full shadow-lift outline-none"
      >
        <Sidebar variant="drawer" onClose={onClose} />
      </div>
    </div>
  );
}
