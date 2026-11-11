'use client';

import { PageHeader } from '@/components/page-header';
import { CoproForm } from '@/components/copro-form';

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
        subtitle="Renseignez les informations de base. Vous pourrez ensuite ajouter bâtiments, lots et tantièmes."
      />
      <CoproForm mode="create" />
    </div>
  );
}
