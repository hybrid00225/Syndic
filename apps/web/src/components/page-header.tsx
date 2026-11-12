'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useBack } from '@/lib/back';

export interface Crumb {
  label: string;
  href?: string;
}

// En-tête : fil d'Ariane → titre (Fraunces) → sous-titre, actions à droite.
export function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
  meta,
  back,
}: {
  crumbs: Crumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Ligne d'éléments sous le titre (badges, références…). */
  meta?: React.ReactNode;
  /** Bouton « Retour » (page précédente) ; la valeur sert si la page a été ouverte directement. */
  back?: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-border pb-5">
      <div className="min-w-0">
        <nav aria-label="Fil d'Ariane" className="no-print flex flex-wrap items-center gap-x-3 gap-y-1">
          {back && <BackButton fallback={back} />}
          <ol className="flex flex-wrap items-center gap-1.5 text-ui text-muted-foreground">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-muted-foreground/50">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-foreground hover:underline underline-offset-4">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-2 font-display text-[2rem] font-medium leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

function BackButton({ fallback }: { fallback: string }) {
  const goBack = useBack(fallback);
  return (
    <button
      type="button"
      onClick={goBack}
      className="-ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-ui font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <ArrowLeft aria-hidden className="h-4 w-4" />
      Retour
      <span aria-hidden className="ml-1.5 h-3.5 w-px bg-border" />
    </button>
  );
}
