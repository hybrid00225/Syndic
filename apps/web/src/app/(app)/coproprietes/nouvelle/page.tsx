'use client';

import { PageHeader } from '@/components/page-header';
import { CoproWizard } from '@/components/copro-wizard';

export default function NouvelleCoproprietePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        back="/coproprietes"
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: 'Nouvelle' },
        ]}
        title="Nouvelle copropriété"
        subtitle="Configurez la copropriété, ses bâtiments et ses lots en une seule fois."
      />
      <CoproWizard />
    </div>
  );
}
