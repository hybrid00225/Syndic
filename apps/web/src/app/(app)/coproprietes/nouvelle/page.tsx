'use client';

import { PageHeader } from '@/components/page-header';
import { CoproForm } from '@/components/copro-form';
import { CoproFormAside } from '@/components/copro-form-aside';

export default function NouvelleCoproprietePage() {
  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: 'Nouvelle' },
        ]}
        title="Nouvelle copropriété"
        subtitle="Renseignez les informations. Vous pourrez ensuite ajouter bâtiments, lots et tantièmes."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CoproForm mode="create" />
        </div>
        <CoproFormAside />
      </div>
    </div>
  );
}
