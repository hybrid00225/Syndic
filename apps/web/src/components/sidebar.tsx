'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  Building,
  Building2,
  Users,
  ReceiptText,
  AlertTriangle,
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { Wordmark } from '@/components/wordmark';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: typeof Home; soon?: boolean };

const sections: { title: string; items: Item[] }[] = [
  {
    title: "Vue d'ensemble",
    items: [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }],
  },
  {
    title: 'Patrimoine',
    items: [
      { href: '/coproprietes', label: 'Copropriétés', icon: Building },
      { href: '/batiments', label: 'Bâtiments', icon: Building2 },
      { href: '/lots', label: 'Lots', icon: Home },
      { href: '/coproprietaires', label: 'Copropriétaires', icon: Users },
    ],
  },
  {
    title: 'Finances',
    items: [
      { href: '/appels', label: 'Appels de fonds', icon: ReceiptText, soon: true },
      { href: '/impayes', label: 'Impayés', icon: AlertTriangle, soon: true },
    ],
  },
];

const COLLAPSE_KEY = 'syndic_alpha_sidebar_collapsed';

export function initiales(nom?: string | null) {
  if (!nom) return '?';
  const parts = nom.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapse = (c: boolean) => {
    setCollapsed(c);
    try {
      localStorage.setItem(COLLAPSE_KEY, c ? '1' : '0');
    } catch {
      /* ignore */
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    const ok = await confirm({
      title: 'Se déconnecter ?',
      description: 'Votre session sera fermée sur cet appareil. Les saisies non enregistrées seront perdues.',
      nextAction: "Retour à l'écran de connexion.",
      confirmLabel: 'Se déconnecter',
    });
    if (ok) logout();
  };

  const q = query.trim().toLowerCase();
  const filtered = sections
    .map((s) => ({ ...s, items: q ? s.items.filter((i) => i.label.toLowerCase().includes(q)) : s.items }))
    .filter((s) => s.items.length > 0);

  return (
    <aside
      className={cn(
        'sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200',
        collapsed ? 'w-[64px]' : 'w-60',
      )}
    >
      {/* En-tête */}
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'justify-between pl-5 pr-2')}>
        <Link href="/dashboard" aria-label="Syndic Alpha — tableau de bord" className="rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <Wordmark compact={collapsed} />
        </Link>
        {!collapsed && (
          <Tooltip label="Replier le menu" side="bottom">
            <button
              type="button"
              onClick={() => setCollapse(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Filtre */}
      <div className={cn('pb-2', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Tooltip label="Déplier le menu" side="right">
              <button
                type="button"
                onClick={() => setCollapse(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <PanelLeftOpen className="h-[18px] w-[18px]" />
              </button>
            </Tooltip>
            <Tooltip label="Filtrer le menu" side="right">
              <button
                type="button"
                onClick={() => {
                  setCollapse(false);
                  setTimeout(() => filterRef.current?.focus(), 220);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={filterRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer le menu…"
              aria-label="Filtrer le menu"
              className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-ui placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation principale" className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {filtered.length === 0 && <p className="px-2 text-ui text-muted-foreground">Aucun résultat.</p>}
        {filtered.map((section, i) => (
          <div key={section.title}>
            {collapsed ? (
              i > 0 && <div aria-hidden className="mx-auto mb-3 h-px w-6 bg-border" />
            ) : (
              <p className="px-2 pb-1.5 text-2xs font-medium text-muted-foreground">{section.title}</p>
            )}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      collapsed ? 'mx-auto h-9 w-9 justify-center' : 'gap-2.5 px-2 py-1.5',
                      active
                        ? 'bg-card font-medium text-foreground shadow-soft ring-1 ring-border'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon aria-hidden className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.soon && (
                      <span className="text-2xs text-muted-foreground/80">bientôt</span>
                    )}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip label={item.soon ? `${item.label} (bientôt)` : item.label} side="right" className="flex">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied : menu utilisateur */}
      <div className="border-t border-border p-2" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={collapsed ? 'Menu du compte' : undefined}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              collapsed && 'justify-center',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-2xs font-semibold text-background">
              {initiales(user?.nom)}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui font-medium">{user?.nom}</span>
                  <span className="block truncate text-2xs text-muted-foreground">
                    {user?.adminSyndic ? 'Administrateur' : 'Gestionnaire'}
                  </span>
                </span>
                <ChevronsUpDown aria-hidden className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>

          {menuOpen && <UserMenu collapsed={collapsed} email={user?.email} onLogout={handleLogout} />}
        </div>
      </div>
    </aside>
  );
}

const THEMES: [ThemeMode, string, typeof Sun][] = [
  ['light', 'Clair', Sun],
  ['dark', 'Sombre', Moon],
  ['system', 'Système', Monitor],
];

function UserMenu({
  collapsed,
  email,
  onLogout,
}: {
  collapsed: boolean;
  email?: string;
  onLogout: () => void;
}) {
  const [theme, setTheme] = useTheme();
  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 w-60 animate-pop-in overflow-hidden rounded-lg border border-border bg-card shadow-lift',
        collapsed ? 'bottom-0 left-full ml-2' : 'bottom-full left-0 mb-2',
      )}
    >
      {email && (
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-2xs text-muted-foreground">Connecté en tant que</p>
          <p className="truncate text-ui font-medium">{email}</p>
        </div>
      )}
      <div className="border-b border-border p-3">
        <p className="mb-2 text-2xs text-muted-foreground">Apparence</p>
        <div className="grid grid-cols-3 gap-1">
          {THEMES.map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              role="menuitemradio"
              aria-checked={theme === mode}
              onClick={() => setTheme(mode)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md border py-2 text-2xs transition-colors',
                theme === mode
                  ? 'border-foreground text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-1">
        <button
          type="button"
          role="menuitem"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-ui text-danger transition-colors hover:bg-danger/10"
        >
          <LogOut aria-hidden className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
