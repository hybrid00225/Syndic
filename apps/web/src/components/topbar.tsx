'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur lg:px-8">
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Rechercher une copropriété, un lot…"
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded-lg py-1 pl-1 pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
            {user?.nom?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <span className="hidden text-sm font-medium md:block">
            {user?.nom}
          </span>
        </div>
      </div>
    </header>
  );
}
