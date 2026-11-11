'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  ReceiptText,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/coproprietes', label: 'Copropriétés', icon: Home },
  { href: '/coproprietaires', label: 'Copropriétaires', icon: Users },
  { href: '/appels', label: 'Appels de fonds', icon: ReceiptText },
  { href: '/impayes', label: 'Impayés', icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-semibold tracking-tight">Syndic Alpha</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent-foreground">
            {user?.nom?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.nom}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.adminSyndic ? 'Administrateur' : 'Utilisateur'}
            </p>
          </div>
          <ThemeToggle />
          <button
            onClick={logout}
            aria-label="Déconnexion"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
