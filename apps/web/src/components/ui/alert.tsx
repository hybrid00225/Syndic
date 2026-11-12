import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'danger' | 'warning' | 'success' | 'info';

const tones: Record<Tone, { cls: string; icon: LucideIcon }> = {
  danger: { cls: 'border-danger/30 bg-danger/5 text-danger', icon: AlertCircle },
  warning: { cls: 'border-warning/30 bg-warning/5 text-warning', icon: TriangleAlert },
  success: { cls: 'border-success/30 bg-success/5 text-success', icon: CheckCircle2 },
  info: { cls: 'border-border bg-muted/50 text-foreground', icon: Info },
};

/**
 * Message en ligne (erreur de formulaire, information).
 * Les erreurs sont annoncées aux lecteurs d'écran (role="alert").
 */
export function Alert({
  tone = 'danger',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  const { cls, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-md border px-3 py-2 text-ui', cls, className)}
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Raccourci : affiche l'erreur si présente, rien sinon. */
export function FormError({ error, className }: { error?: string | null; className?: string }) {
  if (!error) return null;
  return (
    <Alert tone="danger" className={className}>
      {error}
    </Alert>
  );
}
