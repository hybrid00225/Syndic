'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Users,
  ReceiptText,
  AlertTriangle,
  LogOut,
  Search,
  ChevronLeft,
  Settings,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: typeof Home };

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

const COLLAPSE_KEY = 'syndic_alpha_sidebar_collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
  }, []);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });
    setMenuOpen(false);
  };

  // fermeture du menu au clic extérieur
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const q = query.trim().toLowerCase();
  const filtered = sections
    .map((s) => ({
      ...s,
      items: q
        ? s.items.filter((i) => i.label.toLowerCase().includes(q))
        : s.items,
    }))
    .filter((s) => s.items.length > 0);

  return (
    <aside
      className={cn(
        'sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      {/* En-tête */}
      <div
        className={cn(
          'relative flex h-16 items-center border-b border-border',
          collapsed ? 'justify-center px-0' : 'px-5',
        )}
      >
        {collapsed ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
            S
          </div>
        ) : (
          <Wordmark subtitle="Copropriété" />
        )}

        {/* bouton replier/déplier (sur le bord) */}
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          className="absolute -right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:text-foreground"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Filtre */}
      <div className={cn('px-3 pt-3', collapsed && 'px-2')}>
        {collapsed ? (
          <button
            onClick={toggleCollapse}
            aria-label="Rechercher"
            className="flex h-9 w-full items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer le menu…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {filtered.length === 0 && (
          <p className="px-3 text-sm text-muted-foreground">Aucun résultat.</p>
        )}
        {filtered.map((section, i) => (
          <div key={section.title}>
            {collapsed ? (
              i > 0 && <div className="mx-auto mb-3 h-px w-6 bg-border" />
            ) : (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <div key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-lg text-sm font-medium transition-colors',
                        collapsed
                          ? 'h-10 w-10 mx-auto justify-center'
                          : 'gap-3 px-3 py-2',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-md transition group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pied : menu utilisateur */}
      <div className="border-t border-border p-3" ref={menuRef}>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-muted',
              collapsed && 'justify-center',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user?.nom?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.adminSyndic ? 'Administrateur' : 'Gestionnaire'}
                  </p>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>

          {menuOpen && (
            <UserMenu
              collapsed={collapsed}
              email={user?.email}
              onLogout={logout}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

function UserMenu({
  collapsed,
  email,
  onLogout,
}: {
  collapsed: boolean;
  email?: string;
  onLogout: () => void;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('syndic_alpha_theme', next ? 'dark' : 'light');
  };

  return (
    <div
      className={cn(
        'absolute z-50 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lift',
        collapsed ? 'bottom-0 left-full ml-2' : 'bottom-full left-0 mb-2',
      )}
    >
      {email && (
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Connecté en tant que</p>
          <p className="truncate text-sm font-medium">{email}</p>
        </div>
      )}
      <div className="p-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition hover:bg-muted"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? 'Thème clair' : 'Thème sombre'}
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger transition hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
