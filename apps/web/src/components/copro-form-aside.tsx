import { Card } from '@/components/ui/card';
import { Lightbulb, ListChecks } from 'lucide-react';

// Panneau d'aide + onboarding affiché à côté du formulaire (occupe la largeur).
export function CoproFormAside() {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-warning" />
          À savoir
        </div>
        <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
          <li>
            Le <span className="font-medium text-foreground">type</span>{' '}
            (résidentiel, commercial, mixte) et le{' '}
            <span className="font-medium text-foreground">pays</span>{' '}
            conditionnent les règles applicables.
          </li>
          <li>
            Chaque copropriété a sa propre{' '}
            <span className="font-medium text-foreground">devise</span> et ses
            propres paramètres comptables.
          </li>
          <li>
            Le <span className="font-medium text-foreground">statut</span> passe
            de « En création » à « Active » une fois la mise en exploitation
            effective.
          </li>
        </ul>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ListChecks className="h-4 w-4 text-primary" />
          Étapes suivantes
        </div>
        <ol className="mt-3 space-y-2.5 text-sm">
          {[
            'Créer la copropriété',
            'Ajouter les bâtiments et les lots',
            'Enregistrer les copropriétaires et les tantièmes',
            'Générer les premiers appels de fonds',
          ].map((step, i) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </aside>
  );
}
