'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Archive, Building2, Home, MapPin, Globe2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { PageHeader } from '@/components/page-header';
import { formatDate, STATUT_COPRO } from '@/lib/utils';

interface Batiment {
  id: string;
  nom: string;
}
interface Copropriete {
  id: string;
  nom: string;
  pays: string;
  adresse: string | null;
  statut: string;
  dateCreation: string;
  batiments: Batiment[];
}

const statutTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  EN_CREATION: 'warning',
  INACTIVE: 'neutral',
  CLOTUREE: 'neutral',
};

export default function CoproprieteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const [copro, setCopro] = useState<Copropriete | null>(null);

  useEffect(() => {
    api<Copropriete>(`/coproprietes/${id}`).then(setCopro).catch(() => setCopro(null));
  }, [id]);

  if (!copro) return <PageLoader />;

  const archiver = async () => {
    const ok = await confirm({
      title: `Archiver « ${copro.nom} » ?`,
      description:
        'La copropriété passera au statut « Clôturée ». Son historique est conservé.',
      nextAction: 'Vous pourrez la rouvrir en modifiant son statut.',
      confirmLabel: 'Archiver',
      tone: 'danger',
    });
    if (!ok) return;
    await api(`/coproprietes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut: 'CLOTUREE' }),
    });
    router.push('/coproprietes');
  };

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétés', href: '/coproprietes' },
          { label: copro.nom },
        ]}
        title={copro.nom}
        subtitle={copro.adresse ?? 'Adresse non renseignée'}
        actions={
          <>
            <Button variant="secondary" onClick={archiver}>
              <Archive className="h-4 w-4" /> Archiver
            </Button>
            <Button asChild>
              <Link href={`/coproprietes/${id}/modifier`}>
                <Pencil className="h-4 w-4" /> Modifier
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Bâtiments"
          value={copro.batiments.length}
          icon={Building2}
          filled
        />
        <StatTile label="Lots" value="—" icon={Home} tone="success" hint="à venir" />
        <StatTile
          label="Statut"
          value={STATUT_COPRO[copro.statut] ?? copro.statut}
          icon={Globe2}
          tone="info"
        />
        <StatTile
          label="Pays"
          value={copro.pays}
          icon={MapPin}
          tone="warning"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold">Informations</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Info label="Statut">
              <Badge tone={statutTone[copro.statut] ?? 'neutral'} dot>
                {STATUT_COPRO[copro.statut] ?? copro.statut}
              </Badge>
            </Info>
            <Info label="Pays">{copro.pays}</Info>
            <Info label="Adresse">{copro.adresse ?? '—'}</Info>
            <Info label="Créée le">{formatDate(copro.dateCreation)}</Info>
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Bâtiments</h2>
          {copro.batiments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium">Aucun bâtiment</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                La gestion des bâtiments et lots arrive prochainement.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {copro.batiments.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {b.nom}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
