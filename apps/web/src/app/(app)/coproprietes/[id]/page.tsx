'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Pencil,
  Archive,
  Building2,
  Home,
  Coins,
  Layers,
  Users,
  Wallet,
  FileText,
  Hammer,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { PageHeader } from '@/components/page-header';
import { BatimentsLots } from '@/components/batiments-lots';
import { formatDate, STATUT_COPRO, cn } from '@/lib/utils';
import { LABELS } from '@/lib/constants';

interface Batiment {
  id: string;
  nom: string;
}
interface Lot {
  id: string;
  reference: string;
  type: string;
  statut: string;
}
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
  modeRepartition: string;
  description: string | null;
  statut: string;
  dateCreation: string;
  dateMiseExploitation: string | null;
  batiments: Batiment[];
}

const statutTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  EN_CREATION: 'warning',
  INACTIVE: 'neutral',
  CLOTUREE: 'neutral',
};

const TABS = [
  { key: 'infos', label: 'Informations', icon: FileText },
  { key: 'patrimoine', label: 'Bâtiments & lots', icon: Building2 },
  { key: 'coproprietaires', label: 'Copropriétaires', icon: Users },
  { key: 'budgets', label: 'Budgets', icon: Wallet },
  { key: 'documents', label: 'Documents', icon: FileText },
] as const;

export default function CoproprieteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const [copro, setCopro] = useState<Copropriete | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t && TABS.some((x) => x.key === t)) {
        return t as (typeof TABS)[number]['key'];
      }
    }
    return 'infos';
  });

  useEffect(() => {
    api<Copropriete>(`/coproprietes/${id}`).then(setCopro).catch(() => setCopro(null));
    api<Lot[]>(`/coproprietes/${id}/lots`).then(setLots).catch(() => setLots([]));
  }, [id]);

  if (!copro) return <PageLoader />;

  const archiver = async () => {
    const ok = await confirm({
      title: `Archiver « ${copro.nom} » ?`,
      description:
        'La copropriété passera au statut « Clôturée ». Son historique est intégralement conservé.',
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
        subtitle={copro.adresse ?? copro.pays}
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

      {/* Synthèse */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Bâtiments" value={copro.batiments.length} icon={Building2} filled />
        <StatTile label="Lots" value={lots.length} icon={Home} tone="success" />
        <StatTile
          label="Statut"
          value={STATUT_COPRO[copro.statut] ?? copro.statut}
          icon={Layers}
          tone="info"
        />
        <StatTile label="Devise" value={copro.devise} icon={Coins} tone="warning" />
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'infos' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold">Informations générales</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Info label="Référence" value={copro.reference ?? '—'} />
              <Info label="Type" value={LABELS[copro.type] ?? copro.type} />
              <Info label="Pays" value={copro.pays} />
              <Info label="Ensemble immobilier" value={copro.ensembleImmobilier ?? '—'} />
              <Info label="Adresse" value={copro.adresse ?? '—'} />
              <Info label="Devise" value={copro.devise} />
              <Info label="Administration" value={LABELS[copro.natureSyndic] ?? copro.natureSyndic} />
              <Info label="Mode de répartition" value={LABELS[copro.modeRepartition] ?? copro.modeRepartition} />
              <Info
                label="Statut"
                value={
                  <Badge tone={statutTone[copro.statut] ?? 'neutral'} dot>
                    {STATUT_COPRO[copro.statut] ?? copro.statut}
                  </Badge>
                }
              />
              <Info label="Créée le" value={formatDate(copro.dateCreation)} />
              <Info
                label="Mise en exploitation"
                value={
                  copro.dateMiseExploitation
                    ? formatDate(copro.dateMiseExploitation)
                    : '—'
                }
              />
            </dl>
            {copro.description && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{copro.description}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold">Résumé</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <SummaryRow icon={Building2} label="Bâtiments" value={copro.batiments.length} />
              <SummaryRow icon={Home} label="Lots" value={lots.length} />
              <SummaryRow icon={Coins} label="Devise" value={copro.devise} />
              <SummaryRow
                icon={Layers}
                label="Type"
                value={LABELS[copro.type] ?? copro.type}
              />
            </ul>
          </Card>
        </div>
      )}

      {tab === 'patrimoine' && <BatimentsLots coproprieteId={id} />}

      {tab === 'coproprietaires' && (
        <ModuleAVenir
          icon={Users}
          title="Copropriétaires & détentions"
          desc="Le cœur propriété (relation M:N, quote-parts, usufruit) est déjà opérationnel côté serveur. La vue par copropriété arrive prochainement."
        />
      )}
      {tab === 'budgets' && (
        <ModuleAVenir
          icon={Wallet}
          title="Budgets prévisionnels"
          desc="Préparation, postes, exercices et suivi des écarts (domaine 8 de l'analyse) — module à venir."
        />
      )}
      {tab === 'documents' && (
        <ModuleAVenir
          icon={FileText}
          title="Gestion documentaire"
          desc="Règlement de copropriété, PV d'AG, contrats, factures… (domaine 20) — module à venir."
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function ModuleAVenir({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Home;
  title: string;
  desc: string;
}) {
  return (
    <Card className="flex flex-col items-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        <Hammer className="h-3.5 w-3.5" /> En préparation
      </span>
    </Card>
  );
}
