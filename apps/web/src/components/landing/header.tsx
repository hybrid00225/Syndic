'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';

const LIENS = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#demarrage', label: 'Démarrage' },
  { href: '#pour-qui', label: 'Pour qui' },
  { href: '#securite', label: 'Sécurité' },
  { href: '#faq', label: 'FAQ' },
];

/** CTA d'en-tête : « Accéder à mon espace » si connecté, sinon connexion + création. */
function Ctas({ stacked = false, onNavigate }: { stacked?: boolean; onNavigate?: () => void }) {
  const { user, loading } = useAuth();
  if (!loading && user) {
    return (
      <Button asChild size={stacked ? 'lg' : 'sm'} className={cn(stacked && 'w-full')}>
        <Link href="/dashboard" onClick={onNavigate}>
          Accéder à mon espace <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </Button>
    );
  }
  return (
    <div className={cn('flex gap-2', stacked && 'flex-col-reverse')}>
      <Button asChild variant={stacked ? 'secondary' : 'ghost'} size={stacked ? 'lg' : 'sm'}>
        <Link href="/login" onClick={onNavigate}>
          Se connecter
        </Link>
      </Button>
      <Button asChild size={stacked ? 'lg' : 'sm'}>
        <Link href="/login?mode=register" onClick={onNavigate}>
          Créer mon espace
        </Link>
      </Button>
    </div>
  );
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Échap ferme le menu mobile ; il se referme aussi en passant en grand écran.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const mq = matchMedia('(min-width: 1024px)');
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center gap-6 px-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="Syndic Alpha, accueil"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Sections" className="ml-4 hidden lg:block">
          <ul className="flex items-center gap-1">
            {LIENS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-md px-3 py-2 text-ui font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden lg:block">
          <Ctas />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div
        id="menu-mobile"
        hidden={!open}
        className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background px-4 pb-6 pt-2 sm:px-8 lg:hidden"
      >
        <nav aria-label="Sections (mobile)">
          <ul className="divide-y divide-border">
            {LIENS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={close}
                  className="flex items-center justify-between py-3.5 font-display text-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {l.label}
                  <ArrowRight aria-hidden className="h-4 w-4 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4">
          <Ctas stacked onNavigate={close} />
        </div>
      </div>
    </header>
  );
}
