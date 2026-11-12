'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Plus, Mail, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import { nomPersonne, type Personne } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ledger, Stat, Composition, Ring } from '@/components/ui/stat';
import { SearchSelect } from '@/components/ui/select';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Badge } from '@/components/ui/badge';
import { ColumnsMenu, DataTable, SortSelect, TableExport, useDataTable, type Column } from '@/components/ui/data-table';
import {
  ListToolbar,
  Pagination,
  RowAction,
  RowActions,
  SearchInput,
  type View,
} from '@/components/ui/list';
import { PageHeader } from '@/components/page-header';
import { cn, formatDate } from '@/lib/utils';
import { PERSONNE_TYPES, PERSONNE_STATUT_TONE, LABELS } from '@/lib/constants';

type Focus = '' | 'sans-lot' | 'incomplet';

const email = (p: Personne) => p.contacts.find((c) => c.type === 'EMAIL')?.valeur;
const tel = (p: Personne) => p.contacts.find((c) => c.type === 'TELEPHONE')?.valeur;
const nbLots = (p: Personne) => p._count?.detentions ?? 0;

function initiales(p: Personne) {
  if (p.type === 'MORALE') return p.nom.replace(/^(SCI|SARL|SAS|SA)\s+/i, '').slice(0, 2).toUpperCase();
  return `${(p.prenom ?? p.nom)[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase();
}

/** Monogramme : rond = personne physique, carré = personne morale. */
function Monogram({ p, size = 'md' }: { p: Personne; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center border border-border bg-background font-semibold tracking-wide text-foreground',
        size === 'lg' ? 'h-11 w-11 text-ui' : 'h-9 w-9 text-2xs',
        p.type === 'MORALE' ? 'rounded-md' : 'rounded-full',
      )}
    >
      {initiales(p)}
    </span>
  );
}

const COLUMNS: Column<Personne>[] = [
  {
    id: 'nom',
    header: 'Copropriétaire',
    required: true,
    value: (p) => nomPersonne(p),
    cell: (p) => (
      <div className="flex items-center gap-3">
        <Monogram p={p} />
        <div className="min-w-0">
          <Link href={`/coproprietaires/${p.id}`} className="font-medium underline-offset-4 hover:underline">
            {nomPersonne(p)}
          </Link>
          <p className="text-2xs text-muted-foreground">
            {p.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
          </p>
        </div>
      </div>
    ),
  },
  { id: 'type', header: 'Type', defaultHidden: true, value: (p) => LABELS[p.type] ?? p.type, cell: (p) => LABELS[p.type] ?? p.type },
  {
    id: 'email',
    header: 'Email',
    value: email,
    cell: (p) => <span className={cn(!email(p) && 'text-muted-foreground/60')}>{email(p) ?? '—'}</span>,
  },
  {
    id: 'telephone',
    header: 'Téléphone',
    value: tel,
    cell: (p) => <span className={cn('nums', !tel(p) && 'text-muted-foreground/60')}>{tel(p) ?? '—'}</span>,
  },
  {
    id: 'statut',
    header: 'Statut',
    defaultHidden: true,
    value: (p) => (p.statut ? LABELS[p.statut] ?? p.statut : null),
    cell: (p) =>
      p.statut ? <Badge tone={PERSONNE_STATUT_TONE[p.statut] ?? 'neutral'}>{LABELS[p.statut] ?? p.statut}</Badge> : '—',
  },
  {
    id: 'notification',
    header: 'Notification',
    defaultHidden: true,
    value: (p) => (p.modeNotification ? LABELS[p.modeNotification] ?? p.modeNotification : null),
    cell: (p) => (p.modeNotification ? LABELS[p.modeNotification] ?? p.modeNotification : '—'),
  },
  {
    id: 'lots',
    header: 'Lots',
    numeric: true,
    value: nbLots,
    cell: (p) => <span className={cn(nbLots(p) === 0 && 'text-warning')}>{nbLots(p)}</span>,
  },
  {
    id: 'creee',
    header: 'Créée le',
    defaultHidden: true,
    value: (p) => (p.createdAt ? new Date(p.createdAt) : null),
    cell: (p) => <span className="nums text-muted-foreground">{p.createdAt ? formatDate(p.createdAt) : '—'}</span>,
  },
];

export default function CoproprietairesPage() {
  const confirm = useConfirm();
  const alert = useAlert();
  const invalidate = useInvalidate();
  const { data: list, error, isLoading, refetch } = useApi<Personne[]>('/personnes');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [focus, setFocus] = useState<Focus>('');
  const [view, setView] = useState<View>('table');

  const filtered = useMemo(() => {
    if (!list) return [];
    const n = q.trim().toLowerCase();
    return list
      .filter(
        (p) =>
          (!n ||
            nomPersonne(p).toLowerCase().includes(n) ||
            p.contacts.some((c) => c.valeur.toLowerCase().includes(n))) &&
          (!type || p.type === type) &&
          (focus !== 'sans-lot' || nbLots(p) === 0) &&
          (focus !== 'incomplet' || (!email(p) && !tel(p))),
      );
  }, [list, q, type, focus]);

  const table = useDataTable({
    id: 'coproprietaires',
    rows: filtered,
    columns: COLUMNS,
    defaultSort: { id: 'nom', dir: 'asc' },
    resetKey: `${q}|${type}|${focus}`,
  });
  const paged = table.paged;
  const filtres = [
    q && `Recherche : « ${q} »`,
    type && `Type : ${LABELS[type] ?? type}`,
    focus === 'sans-lot' && 'Sans lot rattaché',
    focus === 'incomplet' && 'Injoignables (ni email ni téléphone)',
  ].filter(Boolean) as string[];

  if (isLoading) return <PageLoader label="Chargement des copropriétaires…" />;

  const header = (
    <PageHeader
      crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Copropriétaires' }]}
      title="Copropriétaires"
      subtitle="Personnes physiques et morales qui détiennent des lots."
      actions={
        list && list.length > 0 ? (
          <>
            <TableExport table={table} title="Copropriétaires" filters={filtres} filename="coproprietaires" />
            <Button asChild size="sm">
              <Link href="/coproprietaires/nouveau">
                <Plus className="h-4 w-4" /> Nouveau copropriétaire
              </Link>
            </Button>
          </>
        ) : undefined
      }
    />
  );

  if (error || !list) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title="Aucun copropriétaire enregistré"
          steps={[
            'Créer la fiche : personne physique ou morale',
            'Ajouter email et téléphone (relances, convocations)',
            'Rattacher ses lots et sa quote-part',
          ]}
          actions={
            <Button asChild>
              <Link href="/coproprietaires/nouveau">
                <Plus className="h-4 w-4" /> Créer un copropriétaire
              </Link>
            </Button>
          }
        >
          Un copropriétaire peut être une personne physique ou une société (SCI, entreprise). Il
          peut détenir plusieurs lots, seul ou en indivision.
        </EmptyState>
      </div>
    );
  }

  const physiques = list.filter((p) => p.type === 'PHYSIQUE').length;
  const morales = list.length - physiques;
  const avecLot = list.filter((p) => nbLots(p) > 0).length;
  const sansLot = list.length - avecLot;
  const incomplets = list.filter((p) => !email(p) && !tel(p)).length;
  const hasFilters = !!(q || type || focus);

  const reset = () => {
    setQ('');
    setType('');
    setFocus('');
  };

  const supprimer = async (p: Personne) => {
    const ok = await confirm({
      title: `Supprimer « ${nomPersonne(p)} » ?`,
      description: 'La fiche et ses coordonnées seront définitivement supprimées.',
      nextAction: "Impossible s'il détient des lots ou est lié à des paiements : retirez ces liens d'abord.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/personnes/${p.id}`, { method: 'DELETE' });
      invalidate('/personnes');
    } catch (e) {
      alert('Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  const actions = (p: Personne) => (
    <RowActions>
      <RowAction label="Ouvrir la fiche" icon={Eye} href={`/coproprietaires/${p.id}`} />
      <RowAction label="Modifier" icon={Pencil} href={`/coproprietaires/${p.id}/modifier`} />
      <RowAction label="Supprimer" icon={Trash2} danger onClick={() => supprimer(p)} />
    </RowActions>
  );

  const toggleFocus = (f: Focus) => setFocus((cur) => (cur === f ? '' : f));

  return (
    <div className="space-y-6">
      {header}

      <Ledger>
        <Stat
          lead
          label="Copropriétaires"
          value={list.length}
          info="Toutes les fiches, personnes physiques et morales. Cliquez pour retirer les filtres rapides."
          onClick={() => setFocus('')}
          active={!focus}
          viz={
            <Composition
              segments={[
                { label: 'Personnes physiques', value: physiques, tone: 'ink' },
                { label: 'Personnes morales', value: morales, tone: 'soft' },
              ]}
            />
          }
        />
        <Stat
          label="Détiennent un lot"
          value={avecLot}
          unit={`/ ${list.length}`}
          info="Copropriétaires rattachés à au moins un lot (droit en cours)."
          aside={<Ring value={avecLot / list.length} />}
          note="des fiches ont au moins un lot"
        />
        <Stat
          label="Sans lot rattaché"
          value={sansLot}
          tone={sansLot > 0 ? 'warning' : 'default'}
          info="Fiches qui ne détiennent aucun lot : à rattacher depuis la fiche d'un lot. Cliquez pour filtrer."
          onClick={() => toggleFocus('sans-lot')}
          active={focus === 'sans-lot'}
          note={sansLot > 0 ? 'à rattacher à leurs lots' : 'toutes les fiches sont rattachées'}
        />
        <Stat
          label="Injoignables"
          value={incomplets}
          tone={incomplets > 0 ? 'danger' : 'default'}
          info="Ni email ni téléphone : impossible d'envoyer appels de fonds et relances. Cliquez pour filtrer."
          onClick={() => toggleFocus('incomplet')}
          active={focus === 'incomplet'}
          note={incomplets > 0 ? 'ni email ni téléphone' : 'coordonnées complètes'}
        />
      </Ledger>

      <div className="space-y-4">
        <ListToolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="Nom, email ou téléphone…" />}
          hasFilters={hasFilters}
          onReset={reset}
          count={filtered.length}
          view={view}
          onViewChange={setView}
          tools={view === 'table' ? <ColumnsMenu table={table} /> : <SortSelect table={table} />}
        >
          <SearchSelect
            size="sm"
            className="w-48"
            value={type}
            onChange={setType}
            options={PERSONNE_TYPES}
            allowEmpty
            emptyLabel="Tous les types"
            aria-label="Filtrer par type"
          />
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
            Aucun copropriétaire ne correspond à ces critères.
          </EmptyState>
        ) : view === 'table' ? (
          <DataTable
            table={table}
            rowKey={(p) => p.id}
            rowHref={(p) => `/coproprietaires/${p.id}`}
            rowActions={actions}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paged.pageItems.map((p) => (
                <Card key={p.id} className="flex flex-col transition-colors hover:border-foreground/25">
                  <div className="flex items-start gap-3 p-5 pb-4">
                    <Monogram p={p} size="lg" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/coproprietaires/${p.id}`}
                        className="font-display text-lg font-medium leading-snug underline-offset-4 hover:underline"
                      >
                        {nomPersonne(p)}
                      </Link>
                      <p className="text-2xs text-muted-foreground">
                        {p.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
                      </p>
                    </div>
                    <span className="text-right">
                      <span className={cn('nums block font-display text-2xl leading-none', nbLots(p) === 0 && 'text-warning')}>
                        {nbLots(p)}
                      </span>
                      <span className="text-2xs text-muted-foreground">lot{nbLots(p) > 1 ? 's' : ''}</span>
                    </span>
                  </div>
                  <dl className="space-y-1.5 border-y border-border px-5 py-3 text-ui">
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Email</dt>
                      <Mail aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                      <dd className={cn('truncate', !email(p) && 'text-muted-foreground/60')}>{email(p) ?? 'Pas d’email'}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Téléphone</dt>
                      <Phone aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
                      <dd className={cn('nums', !tel(p) && 'text-muted-foreground/60')}>{tel(p) ?? 'Pas de téléphone'}</dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between px-3 py-2">
                    <Link
                      href={`/coproprietaires/${p.id}`}
                      className="px-2 text-ui font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Ouvrir la fiche
                    </Link>
                    {actions(p)}
                  </div>
                </Card>
              ))}
            </div>
            <Pagination {...paged} />
          </>
        )}
      </div>
    </div>
  );
}
