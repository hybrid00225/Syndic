'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  Sun,
  Moon,
  Monitor,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { NAV_SECTIONS, isActive } from '@/lib/navigation';
import { Wordmark } from '@/components/wordmark';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/icon-button';

const COLLAPSE_KEY = 'syndic_alpha_sidebar_collapsed';

export function initiales(nom?: string | null) {
  if (!nom) return '?';
  const parts = nom.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/**
 * Menu latéral. `rail` : colonne fixe pliable (grand écran) ;
 * `drawer` : contenu du tiroir mobile (jamais plié, se ferme à la navigation).
 */
export function Sidebar({
  variant = 'rail',
  onClose,
  className,
}: {
  variant?: 'rail' | 'drawer';
  onClose?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const drawer = variant === 'drawer';
  const [collapsedPref, setCollapsed] = useState(false);
  const collapsed = !drawer && collapsedPref;
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (drawer) return;
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, [drawer]);

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
  const filtered = NAV_SECTIONS
    .map((s) => ({ ...s, items: q ? s.items.filter((i) => i.label.toLowerCase().includes(q)) : s.items }))
    .filter((s) => s.items.length > 0);

  return (
    <aside
      className={cn(
        'z-40 flex shrink-0 flex-col bg-nav text-nav-foreground',
        drawer
          ? 'h-full w-72 max-w-[85vw]'
          : 'sticky top-0 h-screen border-r border-nav-border transition-[width] duration-200',
        !drawer && (collapsed ? 'w-[64px]' : 'w-60'),
        className,
      )}
    >
      {/* En-tête */}
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'justify-between pl-5 pr-3')}>
        <Link
          href="/dashboard"
          onClick={onClose}
          aria-label="Syndic Alpha — tableau de bord"
          className="rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nav-accent"
        >
          <Wordmark tone="nav" compact={collapsed} />
        </Link>
        {drawer && (
          <IconButton
            label="Fermer le menu"
            icon={X}
            size="sm"
            onClick={onClose}
            className="text-nav-muted hover:bg-nav-hover hover:text-nav-foreground"
          />
        )}
      </div>

      {/* Plier / déplier : toujours au même endroit, à cheval sur la bordure du menu. */}
      {!drawer && (
      <div className="no-print absolute -right-3.5 top-[18px] z-10">
        <IconButton
          label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          size="sm"
          tooltip="right"
          aria-expanded={!collapsed}
          iconClassName="h-3.5 w-3.5"
          onClick={() => setCollapse(!collapsed)}
          className="h-7 w-7 rounded-full border border-border bg-card shadow-soft hover:border-foreground/30 hover:bg-card"
        />
      </div>
      )}

      {/* Filtre */}
      <div className={cn('pb-2', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <IconButton
              label="Filtrer le menu"
              icon={Search}
              tooltip="right"
              iconClassName="h-[18px] w-[18px]"
              className="text-nav-muted hover:bg-nav-hover hover:text-nav-foreground"
              onClick={() => {
                setCollapse(false);
                setTimeout(() => filterRef.current?.focus(), 220);
              }}
            />
          </div>
        ) : (
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nav-muted" />
            <input
              ref={filterRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer le menu…"
              aria-label="Filtrer le menu"
              className="h-9 w-full rounded-md border border-nav-border bg-nav-hover/50 pl-8 pr-3 text-ui text-nav-foreground placeholder:text-nav-muted focus-visible:border-nav-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nav-accent"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation principale" className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-3">
        {filtered.length === 0 && <p className="px-2 text-ui text-nav-muted">Aucun résultat.</p>}
        {filtered.map((section, i) => (
          <div key={section.title}>
            {collapsed ? (
              i > 0 && <div aria-hidden className="mx-auto mb-3 h-px w-6 bg-nav-border" />
            ) : (
              <p className="px-2 pb-1.5 text-2xs font-medium text-nav-muted">{section.title}</p>
            )}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                const link = (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      'relative flex items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nav-accent',
                      collapsed ? 'mx-auto h-9 w-9 justify-center' : 'gap-2.5 px-2.5 py-1.5',
                      // Actif : repère vertical + léger lavis de la teinte d'accent (pas de « carte »).
                      active
                        ? 'bg-nav-accent/10 font-medium text-nav-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-nav-accent'
                        : 'text-nav-muted hover:bg-nav-hover hover:text-nav-foreground',
                    )}
                  >
                    <Icon aria-hidden className={cn('h-4 w-4 shrink-0', active && 'text-nav-accent')} />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {!collapsed && item.soon && (
                      <span className="text-2xs text-nav-muted/80">bientôt</span>
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
      <div className="border-t border-nav-border p-2" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={collapsed ? 'Menu du compte' : undefined}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-nav-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-nav-accent',
              collapsed && 'justify-center',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nav-foreground text-2xs font-semibold text-nav">
              {initiales(user?.nom)}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui font-medium">{user?.nom}</span>
                  <span className="block truncate text-2xs text-nav-muted">
                    {user?.adminSyndic ? 'Administrateur' : 'Gestionnaire'}
                  </span>
                </span>
                <ChevronsUpDown aria-hidden className="h-4 w-4 text-nav-muted" />
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
