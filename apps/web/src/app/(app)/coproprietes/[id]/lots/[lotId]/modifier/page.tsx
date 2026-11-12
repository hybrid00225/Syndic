'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { LotForm } from '@/components/lot-form';
import { LotProprietaires } from '@/components/lot-proprietaires';
import { PageLoader } from '@/components/ui/spinner';

interface Lot {
  id: string;
  reference: string;
  type: string;
  designation: string | null;
  superficie: string | null;
  statut: string;
  batimentId: string | null;
  niveauId: string | null;
}

export default function ModifierLotPage() {
  const { id, lotId } = useParams<{ id: string; lotId: string }>();
  const [lot, setLot] = useState<Lot | null>(null);

  useEffect(() => {
    api<Lot>(`/lots/${lotId}`).then(setLot).catch(() => setLot(null));
  }, [lotId]);

  if (!lot) return <PageLoader />;

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        back={`/coproprietes/${id}?tab=lots`}
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: 'Copropriété', href: `/coproprietes/${id}` },
          { label: `Lot ${lot.reference}` },
        ]}
        title={`Modifier le lot « ${lot.reference} »`}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <LotForm
          coproprieteId={id}
          mode="edit"
          lotId={lotId}
          initial={{
            reference: lot.reference,
            type: lot.type,
            designation: lot.designation ?? '',
            superficie: lot.superficie ? String(lot.superficie) : '',
            statut: lot.statut,
            batimentId: lot.batimentId ?? '',
            niveauId: lot.niveauId ?? '',
          }}
        />
        <LotProprietaires lotId={lotId} />
      </div>
    </div>
  );
}
