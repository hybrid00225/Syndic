'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { CoproForm } from '@/components/copro-form';
import { PageLoader } from '@/components/ui/spinner';

interface Copropriete {
  id: string;
  nom: string;
  pays: string;
  adresse: string | null;
  statut: string;
}

export default function ModifierCoproprietePage() {
  const { id } = useParams<{ id: string }>();
  const [copro, setCopro] = useState<Copropriete | null>(null);

  useEffect(() => {
    api<Copropriete>(`/coproprietes/${id}`).then(setCopro).catch(() => setCopro(null));
  }, [id]);

  if (!copro) return <PageLoader />;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: copro.nom, href: `/coproprietes/${id}` },
          { label: 'Modifier' },
        ]}
        title={`Modifier « ${copro.nom} »`}
      />
      <CoproForm
        mode="edit"
        coproprieteId={id}
        initial={{
          nom: copro.nom,
          pays: copro.pays,
          adresse: copro.adresse ?? '',
          statut: copro.statut,
        }}
      />
    </div>
  );
}
