'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Pencil, Archive } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import type { Copropriete } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ledger, Stat, Composition, Ring, Tokens } from '@/components/ui/stat';
import { SearchSelect } from '@/components/ui/select';
import { CountryLabel, CountrySelect } from '@/components/ui/country';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ColumnsMenu, DataTable, SortSelect, TableExport, useDataTable, type Column } from '@/components/ui/data-table';
import { ListToolbar, Pagination, RowAction, RowActions, SearchInput, type View } from '@/components/ui/list';
import { PageHeader } from '@/components/page-header';
import { formatDate, STATUT_COPRO } from '@/lib/utils';
import { LABELS, nomPays, STATUTS_COPRO, STATUT_COPRO_TONE } from '@/lib/constants';

const statutTone = STATUT_COPRO_TONE;

const date = (v: string | null) => (v ? new Date(v) : null);

// Colonnes : les principales + les informations complémentaires de la fiche (masquées par défaut).
const COLUMNS: Column<Copropriete>[] = [
  {
    id: 'nom',
    header: 'Copropriété',
    required: true,
    value: (c) => c.nom,
    cell: (c) => (
      <>
        <Link href={`/coproprietes/${c.id}`} className="font-medium underline-offset-4 hover:underline">
          {c.nom}
        </Link>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          {[c.reference, c.adresse].filter(Boolean).join(' · ') || 'Adresse non renseignée'}
        </p>
      </>
    ),
  },
  { id: 'reference', header: 'Référence', defaultHidden: true, value: (c) => c.reference, cell: (c) => c.reference ?? '—' },
  { id: 'adresse', header: 'Adresse', defaultHidden: true, value: (c) => c.adresse, cell: (c) => c.adresse ?? '—' },
  {
    id: 'ensemble',
    header: 'Ensemble immobilier',
    defaultHidden: true,
    value: (c) => c.ensembleImmobilier,
    cell: (c) => c.ensembleImmobilier ?? '—',
  },
  { id: 'type', header: 'Type', defaultHidden: true, value: (c) => LABELS[c.type] ?? c.type, cell: (c) => LABELS[c.type] ?? c.type },
  {
    id: 'pays',
    header: 'Pays',
    value: (c) => nomPays(c.pays),
    cell: (c) => <CountryLabel code={c.pays} />,
  },
  { id: 'devise', header: 'Devise', value: (c) => c.devise, cell: (c) => <span className="nums">{c.devise}</span> },
  {
    id: 'nature',
    header: 'Nature du syndic',
    defaultHidden: true,
    value: (c) => LABELS[c.natureSyndic] ?? c.natureSyndic,
    cell: (c) => LABELS[c.natureSyndic] ?? c.natureSyndic,
  },
  {
    id: 'batiments',
    header: 'Bâtiments',
    numeric: true,
    defaultHidden: true,
    value: (c) => c.batiments?.length ?? 0,
    cell: (c) => c.batiments?.length ?? 0,
  },
  {
    id: 'statut',
    header: 'Statut',
    value: (c) => STATUT_COPRO[c.statut] ?? c.statut,
    cell: (c) => <Badge tone={statutTone[c.statut] ?? 'neutral'}>{STATUT_COPRO[c.statut] ?? c.statut}</Badge>,
  },
  {
    id: 'creee',
    header: 'Créée le',
    value: (c) => date(c.dateCreation),
    cell: (c) => <span className="nums text-muted-foreground">{formatDate(c.dateCreation)}</span>,
  },
  {
    id: 'exploitation',
    header: 'Mise en exploitation',
    defaultHidden: true,
    value: (c) => date(c.dateMiseExploitation),
    cell: (c) => <span className="nums text-muted-foreground">{c.dateMiseExploitation ? formatDate(c.dateMiseExploitation) : '—'}</span>,
  },
];

export default function CoproprietesPage() {
  const confirm = useConfirm();
  const alert = useAlert();
  const invalidate = useInvalidate();
  const { data: copros, error, isLoading, refetch } = useApi<Copropriete[]>('/coproprietes');
  const [view, setView] = useState<View>('table');
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [pays, setPays] = useState('');

  const filtered = useMemo(() => {
    if (!copros) return [];
    const needle = q.trim().toLowerCase();
    return copros.filter(
      (c) =>
        (!needle ||
          c.nom.toLowerCase().includes(needle) ||
          (c.adresse ?? '').toLowerCase().includes(needle) ||
          (c.reference ?? '').toLowerCase().includes(needle)) &&
        (!statut || c.statut === statut) &&
        (!pays || c.pays === pays),
    );
  }, [copros, q, statut, pays]);

  const table = useDataTable({
    id: 'coproprietes',
    rows: filtered,
    columns: COLUMNS,
    defaultSort: { id: 'creee', dir: 'desc' },
    resetKey: `${q}|${statut}|${pays}`,
  });
  const paged = table.paged;
  const filtres = [
    q && `Recherche : « ${q} »`,
    statut && `Statut : ${STATUT_COPRO[statut] ?? statut}`,
    pays && `Pays : ${nomPays(pays)}`,
  ].filter(Boolean) as string[];

  if (isLoading) return <PageLoader />;

  const header = (
    <PageHeader
      crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Copropriétés' }]}
      title="Copropriétés"
      subtitle="Les immeubles et ensembles dont vous assurez la gestion."
      actions={
        copros && copros.length > 0 ? (
          <>
            <TableExport table={table} title="Copropriétés" filters={filtres} filename="coproprietes" />
            <Button asChild size="sm">
              <Link href="/coproprietes/nouvelle">
                <Plus className="h-4 w-4" /> Nouvelle copropriété
              </Link>
            </Button>
          </>
        ) : undefined
      }
    />
  );

  if (error || !copros) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (copros.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title="Aucune copropriété pour l'instant"
          steps={[
            'Identité : nom, adresse, pays et devise',
            'Patrimoine : bâtiments, niveaux et lots',
            'Copropriétaires et quotes-parts',
          ]}
          actions={
            <Button asChild>
              <Link href="/coproprietes/nouvelle">
                <Plus className="h-4 w-4" /> Créer une copropriété
              </Link>
            </Button>
          }
        >
          Une copropriété regroupe des bâtiments et des lots détenus par plusieurs propriétaires.
          Sa devise sert à tous ses appels de fonds et encaissements.
        </EmptyState>
      </div>
    );
  }

  const actives = copros.filter((c) => c.statut === 'ACTIVE').length;
  const enCreation = copros.filter((c) => c.statut === 'EN_CREATION').length;
  const cloturees = copros.filter((c) => c.statut === 'CLOTUREE').length;
  const inactives = copros.filter((c) => c.statut === 'INACTIVE').length;
  const devises = [...new Set(copros.map((c) => c.devise))];
  const hasFilters = !!(q || statut || pays);

  const reset = () => {
    setQ('');
    setStatut('');
    setPays('');
  };

  const archiver = async (c: Copropriete) => {
    const ok = await confirm({
      title: `Archiver « ${c.nom} » ?`,
      description:
        'La copropriété passera au statut « Clôturée ». Son historique (lots, appels de fonds, paiements) est intégralement conservé.',
      nextAction: 'Elle quittera les listes actives ; vous pourrez la rouvrir en modifiant son statut.',
      confirmLabel: 'Archiver',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/coproprietes/${c.id}`, { method: 'PATCH', body: JSON.stringify({ statut: 'CLOTUREE' }) });
      invalidate('/coproprietes');
    } catch (e) {
      alert('Archivage impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  const actions = (c: Copropriete) => (
    <RowActions>
      <RowAction label="Ouvrir la fiche" icon={Eye} href={`/coproprietes/${c.id}`} />
      <RowAction label="Modifier" icon={Pencil} href={`/coproprietes/${c.id}/modifier`} />
      {c.statut !== 'CLOTUREE' && <RowAction label="Archiver" icon={Archive} danger onClick={() => archiver(c)} />}
    </RowActions>
  );

  return (
    <div className="space-y-6">
      {header}

      <Ledger>
        <Stat
          lead
          label="Copropriétés"
          value={copros.length}
          info="Toutes les copropriétés gérées, quel que soit leur statut. Cliquez pour retirer le filtre de statut."
          onClick={() => setStatut('')}
          active={!statut}
          viz={
            <Composition
              segments={[
                { label: 'Actives', value: actives, tone: 'ink' },
                { label: 'En création', value: enCreation, tone: 'warn' },
                { label: 'Inactives', value: inactives, tone: 'soft' },
                { label: 'Clôturées', value: cloturees, tone: 'empty' },
              ]}
            />
          }
        />
        <Stat
          label="En exploitation"
          value={actives}
          unit={`/ ${copros.length}`}
          info="Copropriétés au statut « Active ». Cliquez pour filtrer."
          onClick={() => setStatut('ACTIVE')}
          active={statut === 'ACTIVE'}
          aside={<Ring value={actives / copros.length} />}
          note="part du portefeuille en exploitation"
        />
        <Stat
          label="À finaliser"
          value={enCreation}
          tone={enCreation > 0 ? 'warning' : 'default'}
          info="Copropriétés « En création » : à compléter avant le premier appel de fonds. Cliquez pour filtrer."
          onClick={() => setStatut('EN_CREATION')}
          active={statut === 'EN_CREATION'}
          note={enCreation > 0 ? 'fiche ou patrimoine incomplet' : 'rien en attente'}
        />
        <Stat
          label="Devises tenues"
          value={devises.length}
          info="Chaque copropriété tient ses comptes dans sa propre devise."
          aside={<Tokens items={devises} />}
          note={devises.length > 1 ? 'comptes tenus séparément' : 'devise unique'}
        />
      </Ledger>

      <div className="space-y-4">
        <ListToolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="Nom, référence ou adresse…" />}
          hasFilters={hasFilters}
          onReset={reset}
          count={filtered.length}
          view={view}
          onViewChange={setView}
          tools={view === 'table' ? <ColumnsMenu table={table} /> : <SortSelect table={table} />}
        >
          <SearchSelect size="sm" className="w-44" value={statut} onChange={setStatut} options={STATUTS_COPRO} allowEmpty emptyLabel="Tous les statuts" aria-label="Filtrer par statut" />
          <CountrySelect size="sm" className="w-48" value={pays} onChange={setPays} allowEmpty emptyLabel="Tous les pays" aria-label="Filtrer par pays" />
        </ListToolbar>

        {filtered.length === 0 ? (
          <EmptyState
            title="Aucun résultat"
            actions={
              <Button variant="secondary" onClick={reset}>
                Réinitialiser les filtres
              </Button>
            }
          >
            Aucune copropriété ne correspond à ces critères.
          </EmptyState>
        ) : view === 'table' ? (
          <DataTable
            table={table}
            rowKey={(c) => c.id}
            rowHref={(c) => `/coproprietes/${c.id}`}
            rowActions={actions}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paged.pageItems.map((c) => (
              <Card key={c.id} className="flex flex-col transition-colors hover:border-foreground/25">
                <div className="flex items-start justify-between gap-3 p-5 pb-4">
                  <div className="min-w-0">
                    <Link href={`/coproprietes/${c.id}`} className="font-display text-lg font-medium leading-snug hover:underline underline-offset-4">
                      {c.nom}
                    </Link>
                    <p className="mt-1 truncate text-ui text-muted-foreground">
                      {c.adresse ?? 'Adresse non renseignée'}
                    </p>
                  </div>
                  <Badge tone={statutTone[c.statut] ?? 'neutral'}>{STATUT_COPRO[c.statut] ?? c.statut}</Badge>
                </div>
                <dl className="grid grid-cols-3 border-y border-border text-ui">
                  <Meta label="Pays" value={<CountryLabel code={c.pays} className="max-w-full" />} />
                  <Meta label="Devise" value={c.devise} />
                  <Meta label="Créée" value={formatDate(c.dateCreation)} />
                </dl>
                <div className="flex items-center justify-between px-3 py-2">
                  <Link href={`/coproprietes/${c.id}`} className="px-2 text-ui font-medium text-primary hover:underline underline-offset-4">
                    Ouvrir la fiche
                  </Link>
                  {actions(c)}
                </div>
              </Card>
            ))}
          </div>
        )}

        {view === 'cards' && filtered.length > 0 && <Pagination {...paged} />}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-r border-border px-5 py-3 last:border-r-0">
      <dt className="text-2xs text-muted-foreground">{label}</dt>
      <dd className="nums mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}
