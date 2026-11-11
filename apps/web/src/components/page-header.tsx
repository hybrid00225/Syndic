import Link from 'next/link';

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
}: {
  crumbs: Crumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Ligne d'éléments sous le titre (badges, références…). */
  meta?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-border pb-5">
      <div className="min-w-0">
        <nav aria-label="Fil d'Ariane" className="no-print">
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
