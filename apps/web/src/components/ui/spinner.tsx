import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Indicateur compact pour les boutons (action en cours). */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={cn('h-4 w-4 animate-spin', className)} />;
}

/**
 * Loader de marque : le toit se trace, puis les trois lignes du registre
 * s'écrivent une à une — « on construit, on comptabilise ».
 * Apparaît après 200 ms pour ne pas clignoter sur les chargements rapides.
 */
export function BrandLoader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden className={cn('brand-loader h-10 w-10 text-primary', className)}>
      {/* Gabarit fantôme : la forme finale, à peine visible */}
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.12">
        <path d="M3.5 12.5 14 4l10.5 8.5" />
        <path d="M7.5 16h13M7.5 20h13M7.5 24h8" />
      </g>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path className="bl-roof" pathLength={1} d="M3.5 12.5 14 4l10.5 8.5" />
        <path className="bl-line bl-1" pathLength={1} d="M7.5 16h13" />
        <path className="bl-line bl-2" pathLength={1} d="M7.5 20h13" />
        <path className="bl-line bl-3" pathLength={1} d="M7.5 24h8" />
      </g>
    </svg>
  );
}

/** Chargement d'une page (dans le shell). */
export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="brand-loader-in flex h-[55vh] flex-col items-center justify-center gap-4">
      <BrandLoader />
      <span className="font-display text-sm italic text-muted-foreground">{label}</span>
    </div>
  );
}

/** Chargement plein écran (démarrage, vérification de session). */
export function BootLoader({ label = 'Ouverture de votre espace…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="brand-loader-in fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background">
      <BrandLoader className="h-14 w-14" />
      <div className="text-center">
        <p className="font-display text-xl font-medium tracking-tight">
          Syndic <span className="italic text-muted-foreground">Alpha</span>
        </p>
        <p className="mt-1 text-2xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
