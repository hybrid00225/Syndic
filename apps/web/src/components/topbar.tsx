'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, Check, Sun, Moon, Monitor, LogOut, Settings, ChevronDown, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { useApi } from '@/lib/query';
import { nomPersonne, type Copropriete, type Lot, type Personne } from '@/lib/types';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { initiales } from '@/components/sidebar';
import { Wordmark } from '@/components/wordmark';
import { SettingsPanel } from '@/components/settings-panel';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { nomPays } from '@/lib/constants';

type Menu = 'lang' | 'theme' | 'notif' | 'profile' | null;

export function Topbar({
  onOpenNav,
  showBrand,
}: {
  /** Ouvre le tiroir de navigation (petits écrans). */
  onOpenNav: () => void;
  /** Logo visible sur grand écran (disposition « barre de navigation », sans menu latéral). */
  showBrand: boolean;
}) {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const [open, setOpen] = useState<Menu>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setOpen(null);
    const ok = await confirm({
      title: 'Se déconnecter ?',
      description: 'Votre session sera fermée sur cet appareil. Les saisies non enregistrées seront perdues.',
      nextAction: "Retour à l'écran de connexion.",
      confirmLabel: 'Se déconnecter',
    });
    if (ok) logout();
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (m: Menu) => setOpen((o) => (o === m ? null : m));
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:gap-4 sm:px-6 lg:px-10">
        <IconButton label="Ouvrir le menu" icon={MenuIcon} onClick={onOpenNav} className="-ml-1 lg:hidden" />
        <Link
          href="/dashboard"
          aria-label="Syndic Alpha — tableau de bord"
          className={cn('shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', !showBrand && 'lg:hidden')}
        >
          <Wordmark className="hidden sm:flex" />
          <Wordmark compact className="sm:hidden" />
        </Link>
        <GlobalSearch />

        <div ref={ref} className="ml-auto flex items-center gap-0.5">
          {/* Langue */}
          <div className="relative">
            <Tooltip label="Langue de l'interface" side="bottom">
              <button type="button" onClick={() => toggle('lang')} aria-expanded={open === 'lang'} className={triggerCls(open === 'lang')}>
                <span className="text-ui font-semibold">FR</span>
              </button>
            </Tooltip>
            {open === 'lang' && (
              <Panel className="w-44">
                <MenuItem active onClick={() => setOpen(null)}>
                  Français
                  <Check aria-hidden className="ml-auto h-4 w-4" />
                </MenuItem>
                <MenuItem disabled>
                  English
                  <span className="ml-auto text-2xs text-muted-foreground">bientôt</span>
                </MenuItem>
              </Panel>
            )}
          </div>

          {/* Thème */}
          <div className="relative">
            <Tooltip label="Apparence" side="bottom">
              <button type="button" onClick={() => toggle('theme')} aria-expanded={open === 'theme'} className={triggerCls(open === 'theme')}>
                <ThemeIcon className="h-[18px] w-[18px]" />
              </button>
            </Tooltip>
            {open === 'theme' && (
              <Panel className="w-44">
                {(
                  [
                    ['light', 'Clair', Sun],
                    ['dark', 'Sombre', Moon],
                    ['system', 'Système', Monitor],
                  ] as [ThemeMode, string, typeof Sun][]
                ).map(([mode, label, Icon]) => (
                  <MenuItem
                    key={mode}
                    active={theme === mode}
                    onClick={() => {
                      setTheme(mode);
                      setOpen(null);
                    }}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                    {label}
                    {theme === mode && <Check aria-hidden className="ml-auto h-4 w-4" />}
                  </MenuItem>
                ))}
              </Panel>
            )}
          </div>

          {/* Paramètres d'affichage */}
          <Tooltip label="Paramètres d’affichage" side="bottom">
            <button
              type="button"
              onClick={() => {
                setOpen(null);
                setSettingsOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={settingsOpen}
              className={triggerCls(settingsOpen)}
            >
              <Settings className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>

          {/* Notifications */}
          <div className="relative">
            <Tooltip label="Notifications" side="bottom">
              <button type="button" onClick={() => toggle('notif')} aria-expanded={open === 'notif'} className={triggerCls(open === 'notif')}>
                <Bell className="h-[18px] w-[18px]" />
              </button>
            </Tooltip>
            {open === 'notif' && (
              <Panel className="w-80">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-ui font-semibold">Notifications</p>
                </div>
                <div className="px-4 py-6">
                  <p className="text-sm">Aucune notification.</p>
                  <p className="mt-1 text-2xs text-muted-foreground">
                    Les paiements reçus, relances et échéances d&apos;assemblée apparaîtront ici.
                  </p>
                </div>
              </Panel>
            )}
          </div>

          {/* Profil */}
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => toggle('profile')}
              aria-expanded={open === 'profile'}
              aria-haspopup="menu"
              aria-label="Mon compte"
              className={cn(
                'flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                open === 'profile' && 'bg-muted',
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-2xs font-semibold text-background">
                {initiales(user?.nom)}
              </span>
              <span className="hidden text-ui font-medium md:block">{user?.nom}</span>
              <ChevronDown aria-hidden className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
            {open === 'profile' && (
              <Panel className="w-60">
                <div className="border-b border-border px-3 py-3">
                  <p className="truncate text-ui font-medium">{user?.nom}</p>
                  <p className="truncate text-2xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <MenuItem
                    onClick={() => {
                      setOpen(null);
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings aria-hidden className="h-4 w-4" />
                    Paramètres d’affichage
                  </MenuItem>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-ui text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut aria-hidden className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </header>
      {/* Hors du <header> : son flou d'arrière-plan piégerait le positionnement fixe du panneau. */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

// ---------------- Recherche globale (⌘K / Ctrl+K) ----------------
type Hit = { group: string; label: string; sub?: string; href: string };

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [armed, setArmed] = useState(false); // charge les données au premier focus
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const copros = useApi<Copropriete[]>(armed ? '/coproprietes' : null);
  const lots = useApi<Lot[]>(armed ? '/lots' : null);
  const personnes = useApi<Personne[]>(armed ? '/personnes' : null);
  const loading = copros.isLoading || lots.isLoading || personnes.isLoading;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!focused) return;
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [focused]);

  const hits = useMemo<Hit[]>(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    const has = (...s: (string | null | undefined)[]) => s.some((x) => x?.toLowerCase().includes(n));
    const out: Hit[] = [];
    (copros.data ?? [])
      .filter((c) => has(c.nom, c.adresse, c.reference))
      .slice(0, 5)
      .forEach((c) => out.push({ group: 'Copropriétés', label: c.nom, sub: c.adresse ?? nomPays(c.pays), href: `/coproprietes/${c.id}` }));
    (lots.data ?? [])
      .filter((l) => has(l.reference, l.designation))
      .slice(0, 5)
      .forEach((l) =>
        out.push({
          group: 'Lots',
          label: l.reference,
          sub: l.copropriete?.nom,
          href: `/coproprietes/${l.coproprieteId}/lots/${l.id}/modifier`,
        }),
      );
    (personnes.data ?? [])
      .filter((p) => has(p.nom, p.prenom, ...p.contacts.map((c) => c.valeur)))
      .slice(0, 5)
      .forEach((p) => out.push({ group: 'Copropriétaires', label: nomPersonne(p), href: `/coproprietaires/${p.id}` }));
    return out;
  }, [q, copros.data, lots.data, personnes.data]);

  useEffect(() => setActive(0), [q]);

  const go = (h: Hit) => {
    setFocused(false);
    setQ('');
    inputRef.current?.blur();
    router.push(h.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(hits.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    } else if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = focused && q.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative hidden max-w-md flex-1 sm:block">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-label="Rechercher une copropriété, un lot, un copropriétaire"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          setFocused(true);
          setArmed(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Rechercher une copropriété, un lot, une personne…"
        className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-14 text-ui placeholder:text-muted-foreground/70 hover:border-foreground/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border border-border px-1.5 text-2xs text-muted-foreground">
        ⌘K
      </kbd>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[60vh] animate-pop-in overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lift"
        >
          {loading && hits.length === 0 && <p className="px-3 py-3 text-ui text-muted-foreground">Recherche…</p>}
          {!loading && hits.length === 0 && (
            <p className="px-3 py-3 text-ui text-muted-foreground">Aucun résultat pour « {q.trim()} ».</p>
          )}
          {hits.map((h, i) => (
            <div key={h.href}>
              {(i === 0 || hits[i - 1].group !== h.group) && (
                <p className="px-3 pb-1 pt-2.5 text-2xs font-medium text-muted-foreground">{h.group}</p>
              )}
              <Link
                href={h.href}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={(e) => {
                  e.preventDefault();
                  go(h);
                }}
                className={cn('flex items-baseline justify-between gap-3 rounded-md px-3 py-2', i === active && 'bg-muted')}
              >
                <span className="truncate text-sm font-medium">{h.label}</span>
                {h.sub && <span className="truncate text-2xs text-muted-foreground">{h.sub}</span>}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function triggerCls(active: boolean) {
  return cn(
    'flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    active && 'bg-muted text-foreground',
  );
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      role="menu"
      className={cn(
        'absolute right-0 top-full z-50 mt-2 animate-pop-in overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lift',
        className,
      )}
    >
      {children}
    </div>
  );
}

function MenuItem({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-ui transition-colors',
        disabled ? 'cursor-default text-muted-foreground' : 'hover:bg-muted',
        active && 'font-medium text-foreground',
      )}
    >
      {children}
    </button>
  );
}
