'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Users,
  ReceiptText,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';

type Item = {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: string;
};

const sections: { title: string; items: Item[] }[] = [
  {
    title: "Vue d'ensemble",
    items: [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }],
  },
  {
    title: 'Patrimoine',
    items: [
      { href: '/coproprietes', label: 'Copropriétés', icon: Home },
      { href: '/coproprietaires', label: 'Copropriétaires', icon: Users },
    ],
  },
  {
    title: 'Finances',
    items: [
      { href: '/appels', label: 'Appels de fonds', icon: ReceiptText },
      { href: '/impayes', label: 'Impayés', icon: AlertTriangle },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Wordmark subtitle="Copropriété" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user?.nom?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.adminSyndic ? 'Administrateur' : 'Gestionnaire'}
            </p>
          </div>
          <button
            onClick={logout}
            aria-label="Déconnexion"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
