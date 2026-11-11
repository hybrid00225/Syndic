import Link from 'next/link';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * État vide pédagogique, aligné à gauche : dit ce qu'est l'objet métier
 * et comment démarrer. Pas d'icône décorative centrée.
 */
export function EmptyState({
  title,
  children,
  actions,
  steps,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** Mini mode d'emploi numéroté (optionnel). */
  steps?: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-6 rounded-lg border border-dashed border-input bg-card/60 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] md:p-8',
        className,
      )}
    >
      <div>
        <h2 className="font-display text-xl font-medium">{title}</h2>
        {children && <div className="mt-2 max-w-prose text-sm text-muted-foreground">{children}</div>}
        {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {steps && steps.length > 0 && (
        <ol className="space-y-2.5 border-t border-border pt-4 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="nums font-display text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Erreur de chargement : message réel + réessayer. Jamais déguisée en liste vide. */
export function ErrorState({
  error,
  onRetry,
  title = 'Impossible de charger les données',
  className,
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) {
  const msg = error instanceof Error ? error.message : null;
  return (
    <div
      role="alert"
      className={cn('flex flex-wrap items-start gap-3 rounded-lg border border-danger/40 bg-card p-5', className)}
    >
      <AlertCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {msg ?? 'Le serveur ne répond pas.'} Vérifiez votre connexion puis réessayez.
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" /> Réessayer
        </Button>
      )}
    </div>
  );
}

/** Page introuvable (404 sur une fiche). */
export function NotFoundState({
  what,
  backHref,
  backLabel,
}: {
  what: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <EmptyState
      title={`${what} introuvable`}
      actions={
        <Button asChild variant="secondary">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      }
    >
      Elle a peut-être été supprimée, ou le lien est erroné.
    </EmptyState>
  );
}
