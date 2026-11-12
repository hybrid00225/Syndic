import { ArrowRightLeft, ScrollText } from 'lucide-react';
import { Badge, type Tone } from '@/components/ui/badge';
import { Composition, Ring, Stat } from '@/components/ui/stat';
import { LogoMark } from '@/components/wordmark';
import { cn, formatMontant } from '@/lib/utils';

// Données d'exemple : 12 400 000 réparti sur 1 000 tantièmes (montants exacts).
const LIGNES: { lot: string; type: string; qui: string; tantiemes: number; statut: string; tone: Tone }[] = [
  { lot: 'A-101', type: 'Appartement', qui: 'Kouadio Koné', tantiemes: 124, statut: 'Payé', tone: 'success' },
  { lot: 'A-102', type: 'Appartement', qui: 'SCI Horizon', tantiemes: 118, statut: 'Partiel', tone: 'warning' },
  { lot: 'B-004', type: 'Parking', qui: 'Indivision Diallo · 1/2 + 1/2', tantiemes: 12, statut: 'Payé', tone: 'success' },
  { lot: 'C-201', type: 'Commerce', qui: 'Moussa Traoré', tantiemes: 96, statut: 'Retard · 18 j', tone: 'danger' },
];
const TOTAL_APPEL = 12_400_000;

const NAV = ['Tableau de bord', 'Copropriétés', 'Lots', 'Copropriétaires', 'Appels de fonds', 'Impayés'];

/** Aperçu produit construit avec les composants du Design System (aucune image). */
export function ProductPreview() {
  return (
    <figure className="relative">
      <div
        role="img"
        aria-label="Aperçu de Syndic Alpha : appel de fonds du premier trimestre, montants appelés, encaissés et impayés, répartition par lot selon les tantièmes."
        className="overflow-hidden rounded-lg border border-border bg-background shadow-lift"
      >
        {/* Barre d'application */}
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <LogoMark className="h-5 w-5 text-primary" />
          <span className="truncate text-2xs text-muted-foreground">
            Résidence Les Flamboyants <span aria-hidden>›</span> Appels de fonds{' '}
            <span aria-hidden>›</span> <span className="text-foreground">T1 2027</span>
          </span>
          <span className="ml-auto hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.625rem] font-semibold text-primary-foreground sm:flex">
            AK
          </span>
        </div>

        <div className="flex">
          {/* Rail de navigation */}
          <div className="hidden w-40 shrink-0 border-r border-border bg-card px-2 py-3 xl:block">
            {NAV.map((n) => (
              <div
                key={n}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-2xs',
                  n === 'Appels de fonds' ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {n}
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1 space-y-3 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-base font-medium leading-tight sm:text-lg">Appel ordinaire · T1 2027</p>
                <p className="text-2xs text-muted-foreground">Clé « Charges générales » · barème en vigueur au 01/01/2027</p>
              </div>
              <Badge tone="success">Validé</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="col-span-2 flex [&>*]:flex-1">
                <Stat
                  lead
                  label="Appelé"
                  value={'12,4\u00a0M'}
                  unit="XOF"
                  viz={
                    <Composition
                      segments={[
                        { label: 'Payés', value: 31, tone: 'ink' },
                        { label: 'Partiels', value: 6, tone: 'warn' },
                        { label: 'En retard', value: 5, tone: 'danger' },
                      ]}
                    />
                  }
                />
              </div>
              <div className="flex [&>*]:flex-1">
                <Stat label="Encaissé" value={'8,93\u00a0M'} aside={<Ring value={0.72} />} note="72 % de l'appel" />
              </div>
              <div className="flex [&>*]:flex-1">
                <Stat label="Impayés" value={'3,47\u00a0M'} tone="danger" note="5 lots en retard" />
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-border bg-card">
              <table className="w-full text-left text-2xs">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 sm:px-3 font-medium">Lot</th>
                    <th className="hidden px-2 py-2 sm:px-3 font-medium sm:table-cell">Copropriétaire</th>
                    <th className="px-2 py-2 sm:px-3 text-right font-medium">Tantièmes</th>
                    <th className="px-2 py-2 sm:px-3 text-right font-medium">Montant</th>
                    <th className="px-2 py-2 sm:px-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {LIGNES.map((l) => (
                    <tr key={l.lot}>
                      <td className="px-2 py-2 sm:px-3">
                        <span className="font-semibold">{l.lot}</span>
                        <span className="block text-muted-foreground">{l.type}</span>
                      </td>
                      <td className="hidden px-2 py-2 sm:px-3 sm:table-cell">{l.qui}</td>
                      <td className="nums px-2 py-2 sm:px-3 text-right">{l.tantiemes}/1000</td>
                      <td className="nums px-2 py-2 sm:px-3 text-right font-medium">
                        {formatMontant((TOTAL_APPEL * l.tantiemes) / 1000)}
                      </td>
                      <td className="px-2 py-2 sm:px-3">
                        <Badge tone={l.tone}>{l.statut}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Vignettes flottantes (grand écran uniquement : pas de débordement en mobile) */}
      <div
        aria-hidden
        className="absolute -bottom-6 -left-6 hidden w-64 rounded-lg border border-border bg-card p-3 shadow-lift lg:block"
      >
        <p className="flex items-center gap-1.5 text-2xs font-semibold">
          <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
          Paiement affecté
        </p>
        <p className="nums mt-1 text-2xs text-muted-foreground">
          Virement de {formatMontant(750_000, 'XOF')} → lot A-102
        </p>
        <p className="nums mt-0.5 text-2xs">
          Reste dû <span className="font-semibold text-warning">{formatMontant(713_200, 'XOF')}</span>
        </p>
      </div>
      <div
        aria-hidden
        className="absolute -top-6 right-16 hidden rounded-lg border border-border bg-card px-2 py-2 sm:px-3 shadow-lift lg:block"
      >
        <p className="flex items-center gap-1.5 text-2xs font-semibold">
          <ScrollText className="h-3.5 w-3.5 text-accent" />
          Journal d&apos;audit
        </p>
        <p className="text-2xs text-muted-foreground">Appel validé par A. Koné · 09:42</p>
      </div>

      <figcaption className="mt-3 text-2xs text-muted-foreground lg:mt-10 lg:text-right">
        Reconstitution de l&apos;interface · données d&apos;exemple.
      </figcaption>
    </figure>
  );
}
