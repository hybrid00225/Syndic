'use client';

import { BE, BF, BJ, CA, CH, CI, CM, FR, GA, MA, ML, SN, TG, TN } from 'country-flag-icons/react/3x2';
import type { FlagComponent } from 'country-flag-icons/react/3x2';
import { Globe } from 'lucide-react';
import { PAYS, nomPays } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { SearchSelect } from './select';

// Drapeaux SVG (rendu identique sur tous les systèmes, contrairement aux émojis
// qui ne s'affichent pas sous Windows). Import explicite : seuls ces drapeaux
// sont embarqués. Ajouter ici tout nouveau pays de PAYS.
const FLAGS: Record<string, FlagComponent> = {
  BE, BF, BJ, CA, CH, CI, CM, FR, GA, MA, ML, SN, TG, TN,
};

/** Drapeau d'un pays (code ISO 3166-1 alpha-2) ; globe si inconnu ou « Autre ». */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const Flag = FLAGS[code.toUpperCase()];
  if (!Flag) {
    return <Globe aria-hidden className={cn('h-4 w-4 shrink-0 text-muted-foreground', className)} />;
  }
  return (
    <Flag
      aria-hidden
      className={cn('h-3.5 w-[1.3125rem] shrink-0 rounded-[2px] shadow-[0_0_0_1px_hsl(var(--foreground)/0.12)]', className)}
    />
  );
}

/** Pays affiché partout dans l'application : drapeau + nom. */
export function CountryLabel({ code, className }: { code: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <CountryFlag code={code} />
      {nomPays(code)}
    </span>
  );
}

/** Sélecteur de pays : la liste standard (ou une liste fournie), avec drapeaux. */
export function CountrySelect({
  options = PAYS,
  ...props
}: Omit<React.ComponentProps<typeof SearchSelect>, 'options' | 'renderIcon'> & {
  options?: React.ComponentProps<typeof SearchSelect>['options'];
}) {
  return (
    <SearchSelect
      {...props}
      options={options}
      searchPlaceholder={props.searchPlaceholder ?? 'Rechercher un pays…'}
      renderIcon={(code) => <CountryFlag code={code} />}
    />
  );
}
