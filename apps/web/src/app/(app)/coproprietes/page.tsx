'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Pencil, Archive, Printer, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import type { Copropriete } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ledger, Stat, Units } from '@/components/ui/stat';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, Th, Td, Tr } from '@/components/ui/table';
import {
  ListToolbar,
  Pagination,
  RowAction,
  RowActions,
  SearchInput,
  usePaged,
  type View,
} from '@/components/ui/list';
import { PageHeader } from '@/components/page-header';
import { exportCsv } from '@/lib/csv';
import { formatDate, STATUT_COPRO } from '@/lib/utils';
import { PAYS, STATUTS_COPRO, STATUT_COPRO_TONE } from '@/lib/constants';

const statutTone = STATUT_COPRO_TONE;

const SORT_OPTIONS: [string, string][] = [
  ['recent', 'Plus récentes'],
  ['ancien', 'Plus anciennes'],
  ['nom', 'Nom (A→Z)'],
  ['nom-desc', 'Nom (Z→A)'],
];

const paysLabel = (code: string) => PAYS.find((p) => p[0] === code)?.[1] ?? code;

export default function CoproprietesPage() {
  const confirm = useConfirm();
  const alert = useAlert();
  const invalidate = useInvalidate();
  const { data: copros, error, isLoading, refetch } = useApi<Copropriete[]>('/coproprietes');
  const [view, setView] = useState<View>('table');
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [pays, setPays] = useState('');
  const [sort, setSort] = useState('recent');

  const filtered = useMemo(() => {
    if (!copros) return [];
    const needle = q.trim().toLowerCase();
    const res = copros.filter(
      (c) =>
        (!needle ||
          c.nom.toLowerCase().includes(needle) ||
          (c.adresse ?? '').toLowerCase().includes(needle) ||
          (c.reference ?? '').toLowerCase().includes(needle)) &&
        (!statut || c.statut === statut) &&
        (!pays || c.pays === pays),
    );
    res.sort((a, b) => {
      if (sort === 'nom') return a.nom.localeCompare(b.nom, 'fr');
      if (sort === 'nom-desc') return b.nom.localeCompare(a.nom, 'fr');
      const da = +new Date(a.dateCreation);
      const db = +new Date(b.dateCreation);
      return sort === 'ancien' ? da - db : db - da;
    });
    return res;
  }, [copros, q, statut, pays, sort]);

  const paged = usePaged(filtered, 10, `${q}|${statut}|${pays}|${sort}`);

  if (isLoading) return <PageLoader />;

  const header = (
    <PageHeader
      crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Copropriétés' }]}
      title="Copropriétés"
      subtitle="Les immeubles et ensembles dont vous assurez la gestion."
      actions={
        copros && copros.length > 0 ? (
          <>
            <Tooltip label="Imprimer la liste filtrée" side="bottom">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimer
              </Button>
            </Tooltip>
            <Tooltip label="Télécharger la liste filtrée (CSV, Excel)" side="bottom">
              <Button variant="secondary" size="sm" onClick={() => exporter()}>
                <Download className="h-4 w-4" /> Exporter
              </Button>
            </Tooltip>
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
  const hasFilters = !!(q || statut || pays || sort !== 'recent');

  const reset = () => {
    setQ('');
    setStatut('');
    setPays('');
    setSort('recent');
  };

  function exporter() {
    exportCsv(
      'coproprietes.csv',
      ['Nom', 'Référence', 'Adresse', 'Pays', 'Devise', 'Statut', 'Créée le'],
      filtered.map((c) => [
        c.nom,
        c.reference,
        c.adresse,
        paysLabel(c.pays),
        c.devise,
        STATUT_COPRO[c.statut] ?? c.statut,
        formatDate(c.dateCreation),
      ]),
    );
  }

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
            <Units
              segments={[
                { label: 'Actives', value: actives, tone: 'ink' },
                { label: 'En création', value: enCreation, tone: 'warn' },
                { label: 'Inactives', value: inactives, tone: 'soft' },
                { label: 'Clôturées', value: cloturees, tone: 'empty' },
              ]}
            />
          }
          note={
            <>
              <span className="nums">{actives}</span> active{actives > 1 ? 's' : ''} ·{' '}
              <span className="nums">{enCreation}</span> en création ·{' '}
              <span className="nums">{inactives + cloturees}</span> hors exploitation
            </>
          }
        />
        <Stat
          label="En exploitation"
          value={actives}
          unit={`/ ${copros.length}`}
          info="Copropriétés au statut « Active ». Cliquez pour filtrer."
          onClick={() => setStatut('ACTIVE')}
          active={statut === 'ACTIVE'}
          note={`${Math.round((actives / copros.length) * 100)} % du portefeuille`}
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
          note={devises.join(' · ')}
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
        >
          <SearchSelect size="sm" className="w-44" value={statut} onChange={setStatut} options={STATUTS_COPRO} allowEmpty emptyLabel="Tous les statuts" aria-label="Filtrer par statut" />
          <SearchSelect size="sm" className="w-44" value={pays} onChange={setPays} options={PAYS} allowEmpty emptyLabel="Tous les pays" aria-label="Filtrer par pays" />
          <SearchSelect size="sm" className="w-44" value={sort} onChange={setSort} options={SORT_OPTIONS} aria-label="Trier" />
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
          <Table>
            <thead>
              <tr>
                <Th>Copropriété</Th>
                <Th>Pays</Th>
                <Th>Devise</Th>
                <Th>Statut</Th>
                <Th>Créée le</Th>
                <Th className="no-print">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {paged.pageItems.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/coproprietes/${c.id}`} className="font-medium hover:underline underline-offset-4">
                      {c.nom}
                    </Link>
                    <p className="mt-0.5 text-2xs text-muted-foreground">
                      {[c.reference, c.adresse].filter(Boolean).join(' · ') || 'Adresse non renseignée'}
                    </p>
                  </Td>
                  <Td>{paysLabel(c.pays)}</Td>
                  <Td className="nums">{c.devise}</Td>
                  <Td>
                    <Badge tone={statutTone[c.statut] ?? 'neutral'}>{STATUT_COPRO[c.statut] ?? c.statut}</Badge>
                  </Td>
                  <Td className="nums text-muted-foreground">{formatDate(c.dateCreation)}</Td>
                  <Td>{actions(c)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
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
                  <Meta label="Pays" value={paysLabel(c.pays)} />
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

        <Pagination {...paged} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-border px-5 py-3 last:border-r-0">
      <dt className="text-2xs text-muted-foreground">{label}</dt>
      <dd className="nums mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}
