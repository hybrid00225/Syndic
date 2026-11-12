'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { PersonneForm } from '@/components/personne-form';
import { PageLoader } from '@/components/ui/spinner';

interface Contact {
  type: string;
  valeur: string;
  libelle: string | null;
}
interface Personne {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
  contacts: Contact[];
}

export default function ModifierCoproprietairePage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Personne | null>(null);

  useEffect(() => {
    api<Personne>(`/personnes/${id}`).then(setP).catch(() => setP(null));
  }, [id]);

  if (!p) return <PageLoader />;

  const nom = p.type === 'MORALE' ? p.nom : `${p.prenom ?? ''} ${p.nom}`.trim();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        back={`/coproprietaires/${id}`}
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétaires', href: '/coproprietaires' },
          { label: nom, href: `/coproprietaires/${id}` },
          { label: 'Modifier' },
        ]}
        title={`Modifier « ${nom} »`}
      />
      <div className="max-w-3xl">
        <PersonneForm
          mode="edit"
          personneId={id}
          initial={{
            type: p.type,
            nom: p.nom,
            prenom: p.prenom ?? '',
            contacts: p.contacts.map((c) => ({
              type: c.type,
              valeur: c.valeur,
              libelle: c.libelle ?? '',
            })),
          }}
        />
      </div>
    </div>
  );
}
