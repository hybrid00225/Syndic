'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS, isActive } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/**
 * Navigation horizontale (disposition « Barre de navigation », grand écran).
 * Les sections sont séparées par un filet ; l'élément actif est souligné.
 */
export function TopNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="sticky top-16 z-20 hidden border-b border-nav-border bg-nav text-nav-foreground lg:block"
    >
      <ul className="flex items-center gap-1 overflow-x-auto px-10">
        {NAV_SECTIONS.map((section, si) =>
          section.items.map((item, ii) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex items-center">
                {si > 0 && ii === 0 && <span aria-hidden className="mx-2 h-4 w-px bg-nav-border" />}
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-11 items-center gap-2 whitespace-nowrap rounded-sm px-3 text-ui transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-nav-accent',
                    active
                      ? 'font-medium text-nav-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-nav-accent'
                      : 'text-nav-muted hover:text-nav-foreground',
                  )}
                >
                  <Icon aria-hidden className={cn('h-4 w-4', active && 'text-nav-accent')} />
                  {item.label}
                  {item.soon && <span className="text-2xs text-nav-muted/80">bientôt</span>}
                </Link>
              </li>
            );
          }),
        )}
      </ul>
    </nav>
  );
}
