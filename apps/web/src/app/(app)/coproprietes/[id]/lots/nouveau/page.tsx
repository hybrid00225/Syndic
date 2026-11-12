'use client';

import { useParams } from 'next/navigation';
import { Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { LotForm } from '@/components/lot-form';
import { Card } from '@/components/ui/card';

export default function NouveauLotPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        back={`/coproprietes/${id}?tab=lots`}
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: 'Copropriété', href: `/coproprietes/${id}` },
          { label: 'Nouveau lot' },
        ]}
        title="Nouveau lot"
        subtitle="Un lot possède une référence unique dans la copropriété."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LotForm coproprieteId={id} mode="create" />
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-warning" /> À savoir
            </div>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li>
                La <span className="font-medium text-foreground">référence</span>{' '}
                doit être unique dans la copropriété (ex. « A101 »).
              </li>
              <li>
                Un lot peut être un appartement, un parking, une cave, un magasin…
              </li>
              <li>
                Le rattachement bâtiment / niveau est optionnel (un parking
                extérieur peut n&apos;avoir ni l&apos;un ni l&apos;autre).
              </li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
