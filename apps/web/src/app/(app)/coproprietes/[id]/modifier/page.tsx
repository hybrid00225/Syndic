'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { CoproForm } from '@/components/copro-form';
import { CoproFormAside } from '@/components/copro-form-aside';
import { PageLoader } from '@/components/ui/spinner';

interface Copropriete {
  id: string;
  nom: string;
  reference: string | null;
  type: string;
  pays: string;
  adresse: string | null;
  ensembleImmobilier: string | null;
  devise: string;
  natureSyndic: string;
  description: string | null;
  statut: string;
  dateMiseExploitation: string | null;
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
        back={`/coproprietes/${id}`}
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: copro.nom, href: `/coproprietes/${id}` },
          { label: 'Modifier' },
        ]}
        title={`Modifier « ${copro.nom} »`}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CoproForm
            mode="edit"
            coproprieteId={id}
            initial={{
              nom: copro.nom,
              reference: copro.reference ?? '',
              type: copro.type,
              pays: copro.pays,
              adresse: copro.adresse ?? '',
              ensembleImmobilier: copro.ensembleImmobilier ?? '',
              devise: copro.devise,
              natureSyndic: copro.natureSyndic,
              description: copro.description ?? '',
              statut: copro.statut,
              dateMiseExploitation: copro.dateMiseExploitation
                ? copro.dateMiseExploitation.slice(0, 10)
                : '',
            }}
          />
        </div>
        <CoproFormAside />
      </div>
    </div>
  );
}
