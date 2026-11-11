'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Search,
  Globe,
  Check,
  Sun,
  Moon,
  Monitor,
  Inbox,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { cn } from '@/lib/utils';

type Menu = 'lang' | 'theme' | 'notif' | 'profile' | null;
type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'syndic_alpha_theme';

function applyTheme(mode: ThemeMode) {
  const dark =
    mode === 'dark' ||
    (mode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  if (mode === 'system') localStorage.removeItem(THEME_KEY);
  else localStorage.setItem(THEME_KEY, mode);
}

export function Topbar() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const [open, setOpen] = useState<Menu>(null);
  const [lang, setLang] = useState('FR');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const ref = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setOpen(null);
    const ok = await confirm({
      title: 'Se déconnecter ?',
      description:
        'Vous allez quitter votre session. Les éléments non enregistrés seront perdus.',
      nextAction: "Vous reviendrez à l'écran de connexion.",
      confirmLabel: 'Se déconnecter',
      tone: 'danger',
    });
    if (ok) logout();
  };

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    setTheme(stored ?? 'system');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = (m: Menu) => setOpen((o) => (o === m ? null : m));
  const chooseTheme = (m: ThemeMode) => {
    setTheme(m);
    applyTheme(m);
    setOpen(null);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur lg:px-8">
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Rechercher une copropriété, un lot…"
          className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>

      <div ref={ref} className="ml-auto flex items-center gap-0.5">
        {/* Langue */}
        <div className="relative">
          <Tooltip label="Langue de l'interface" side="bottom">
            <button
              onClick={() => toggle('lang')}
              className={triggerCls(open === 'lang')}
              aria-label="Langue"
            >
              <Globe className="h-[18px] w-[18px]" />
              <span className="text-xs font-semibold">{lang}</span>
            </button>
          </Tooltip>
          {open === 'lang' && (
            <Panel className="w-40">
              <MenuItem
                active={lang === 'FR'}
                onClick={() => {
                  setLang('FR');
                  setOpen(null);
                }}
              >
                🇨🇮 Français
                {lang === 'FR' && <Check className="ml-auto h-4 w-4" />}
              </MenuItem>
              <MenuItem disabled>
                🇬🇧 English
                <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                  bientôt
                </span>
              </MenuItem>
            </Panel>
          )}
        </div>

        {/* Thème */}
        <div className="relative">
          <Tooltip label="Apparence (clair / sombre)" side="bottom">
            <button
              onClick={() => toggle('theme')}
              className={triggerCls(open === 'theme')}
              aria-label="Thème"
            >
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
                ] as const
              ).map(([mode, label, Icon]) => (
                <MenuItem
                  key={mode}
                  active={theme === mode}
                  onClick={() => chooseTheme(mode)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {theme === mode && <Check className="ml-auto h-4 w-4" />}
                </MenuItem>
              ))}
            </Panel>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <Tooltip label="Notifications" side="bottom">
            <button
              onClick={() => toggle('notif')}
              className={cn(triggerCls(open === 'notif'), 'relative')}
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>
          </Tooltip>
          {open === 'notif' && (
            <Panel className="w-80">
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <p className="text-sm font-semibold">Notifications</p>
                <button
                  disabled
                  className="text-xs font-medium text-muted-foreground"
                >
                  Tout marquer comme lu
                </button>
              </div>
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium">Vous êtes à jour</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Aucune notification pour le moment.
                </p>
              </div>
            </Panel>
          )}
        </div>

        {/* Profil */}
        <div className="relative ml-1">
          <button
            onClick={() => toggle('profile')}
            className={cn(
              'flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-muted',
              open === 'profile' && 'bg-muted',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
              {user?.nom?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <span className="hidden text-sm font-medium md:block">
              {user?.nom}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
          </button>
          {open === 'profile' && (
            <Panel className="w-60">
              <div className="flex items-center gap-3 border-b border-border px-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {user?.nom?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="p-1">
                <MenuItem disabled>
                  <Settings className="h-4 w-4" />
                  Paramètres
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                    bientôt
                  </span>
                </MenuItem>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger transition hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </header>
  );
}

function triggerCls(active: boolean) {
  return cn(
    'flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground',
    active && 'bg-muted text-foreground',
  );
}

function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lift',
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
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition',
        disabled
          ? 'cursor-default text-muted-foreground'
          : 'hover:bg-muted',
        active && 'text-primary',
      )}
    >
      {children}
    </button>
  );
}
