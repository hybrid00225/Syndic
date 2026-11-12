'use client';

import { Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PersonneForm } from '@/components/personne-form';
import { Card } from '@/components/ui/card';

export default function NouveauCoproprietairePage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        back="/coproprietaires"
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétaires', href: '/coproprietaires' },
          { label: 'Nouveau' },
        ]}
        title="Nouveau copropriétaire"
        subtitle="Personne physique ou morale. Vous pourrez ensuite lui attribuer des lots."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PersonneForm mode="create" />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-warning" /> À savoir
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>Un copropriétaire peut être une <span className="font-medium text-foreground">personne physique</span> ou <span className="font-medium text-foreground">morale</span> (société, SCI…).</li>
              <li>Il peut avoir <span className="font-medium text-foreground">plusieurs coordonnées</span> (emails, téléphones, adresses).</li>
              <li>L&apos;attribution des <span className="font-medium text-foreground">lots</span> (avec quote-part) se fait depuis la fiche du lot ou du copropriétaire.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
