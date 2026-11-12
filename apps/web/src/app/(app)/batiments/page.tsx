'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import type { Batiment, CoproRef } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Ledger, Stat, Composition } from '@/components/ui/stat';
import { SearchSelect } from '@/components/ui/select';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ColumnsMenu, DataTable, TableExport, useDataTable, type Column } from '@/components/ui/data-table';
import { ListToolbar, RowAction, RowActions, SearchInput } from '@/components/ui/list';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

const fiche = (b: Batiment) => `/coproprietes/${b.coproprieteId}?tab=batiments`;

const COLUMNS: Column<Batiment>[] = [
  {
    id: 'nom',
    header: 'Bâtiment',
    required: true,
    value: (b) => b.nom,
    cell: (b) => (
      <Link href={fiche(b)} className="font-medium underline-offset-4 hover:underline">
        {b.nom}
      </Link>
    ),
  },
  {
    id: 'copropriete',
    header: 'Copropriété',
    value: (b) => b.copropriete.nom,
    cell: (b) => (
      <Link href={`/coproprietes/${b.coproprieteId}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {b.copropriete.nom}
      </Link>
    ),
  },
  { id: 'niveaux', header: 'Niveaux', numeric: true, value: (b) => b._count.niveaux, cell: (b) => b._count.niveaux },
  {
    id: 'lots',
    header: 'Lots',
    numeric: true,
    value: (b) => b._count.lots,
    cell: (b) => <span className={cn(b._count.lots === 0 && 'text-warning')}>{b._count.lots}</span>,
  },
];

const moyenne = (total: number, n: number) =>
  n ? (total / n).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '0';

export default function BatimentsPage() {
  const confirm = useConfirm();
  const alert = useAlert();
  const invalidate = useInvalidate();
  const { data: batiments, error, isLoading, refetch } = useApi<Batiment[]>('/batiments');
  const { data: copros = [] } = useApi<CoproRef[]>('/coproprietes');
  const [q, setQ] = useState('');
  const [copro, setCopro] = useState('');
  const [sansLot, setSansLot] = useState(false);

  const filtered = useMemo(() => {
    if (!batiments) return [];
    const n = q.trim().toLowerCase();
    return batiments
      .filter(
        (b) =>
          (!n || b.nom.toLowerCase().includes(n) || b.copropriete.nom.toLowerCase().includes(n)) &&
          (!copro || b.coproprieteId === copro) &&
          (!sansLot || b._count.lots === 0),
      )
      // Ordre de base (copropriété puis bâtiment) quand aucun tri n'est choisi.
      .sort((a, b) => a.copropriete.nom.localeCompare(b.copropriete.nom, 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  }, [batiments, q, copro, sansLot]);

  const table = useDataTable({ id: 'batiments', rows: filtered, columns: COLUMNS, resetKey: `${q}|${copro}|${sansLot}` });
  const filtres = [
    q && `Recherche : « ${q} »`,
    copro && `Copropriété : ${copros.find((c) => c.id === copro)?.nom ?? ''}`,
    sansLot && 'Bâtiments sans lot',
  ].filter(Boolean) as string[];

  if (isLoading) return <PageLoader label="Chargement des bâtiments…" />;

  const header = (
    <PageHeader
      crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Bâtiments' }]}
      title="Bâtiments"
      subtitle="Tous les bâtiments de votre portefeuille. Ils se créent depuis la fiche de leur copropriété."
      actions={
        batiments && batiments.length > 0 ? (
          <TableExport table={table} title="Bâtiments" filters={filtres} filename="batiments" />
        ) : undefined
      }
    />
  );

  if (error || !batiments) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (batiments.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title="Aucun bâtiment déclaré"
          steps={['Ouvrir une copropriété', 'Onglet Patrimoine : ajouter un bâtiment', 'Déclarer ses niveaux puis ses lots']}
          actions={
            <Button asChild>
              <Link href="/coproprietes">Aller aux copropriétés</Link>
            </Button>
          }
        >
          Un bâtiment appartient à une copropriété et se découpe en niveaux (étages, sous-sols) qui
          accueillent les lots.
        </EmptyState>
      </div>
    );
  }

  const sumNiv = batiments.reduce((s, b) => s + b._count.niveaux, 0);
  const sumLots = batiments.reduce((s, b) => s + b._count.lots, 0);
  const nbSansLot = batiments.filter((b) => b._count.lots === 0).length;
  const hasFilters = !!(q || copro || sansLot);

  const reset = () => {
    setQ('');
    setCopro('');
    setSansLot(false);
  };

  const supprimer = async (b: Batiment) => {
    const ok = await confirm({
      title: `Supprimer « ${b.nom} » ?`,
      description: `Bâtiment de « ${b.copropriete.nom} ». La suppression est définitive.`,
      nextAction: "Impossible s'il contient des niveaux ou des lots : supprimez-les d'abord.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/batiments/${b.id}`, { method: 'DELETE' });
      invalidate('/batiments', '/coproprietes');
    } catch (e) {
      alert('Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  return (
    <div className="space-y-6">
      {header}

      <Ledger>
        <Stat
          lead
          label="Bâtiments"
          value={batiments.length}
          info="Tous les bâtiments de vos copropriétés. Cliquez pour retirer le filtre rapide."
          onClick={() => setSansLot(false)}
          active={!sansLot}
          viz={
            <Composition
              segments={[
                { label: 'Avec lots', value: batiments.length - nbSansLot, tone: 'ink' },
                { label: 'Sans lot', value: nbSansLot, tone: 'warn' },
              ]}
            />
          }
        />
        <Stat
          label="Niveaux"
          value={sumNiv}
          info="Étages et sous-sols déclarés, tous bâtiments confondus."
          note={`${moyenne(sumNiv, batiments.length)} par bâtiment en moyenne`}
        />
        <Stat
          label="Lots"
          value={sumLots}
          info="Lots rattachés à un bâtiment."
          note={`${moyenne(sumLots, batiments.length)} par bâtiment en moyenne`}
        />
        <Stat
          label="Sans lot"
          value={nbSansLot}
          tone={nbSansLot > 0 ? 'warning' : 'default'}
          info="Bâtiments sans aucun lot déclaré. Cliquez pour filtrer."
          onClick={() => setSansLot((v) => !v)}
          active={sansLot}
          note={nbSansLot > 0 ? 'patrimoine à compléter' : 'tous les bâtiments ont des lots'}
        />
      </Ledger>

      <div className="space-y-4">
        <ListToolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="Bâtiment ou copropriété…" />}
          hasFilters={hasFilters}
          onReset={reset}
          count={filtered.length}
          tools={<ColumnsMenu table={table} />}
        >
          <SearchSelect
            size="sm"
            className="w-56"
            value={copro}
            onChange={setCopro}
            options={copros.map((c) => [c.id, c.nom] as const)}
            allowEmpty
            emptyLabel="Toutes les copropriétés"
            aria-label="Filtrer par copropriété"
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
            Aucun bâtiment ne correspond à ces critères.
          </EmptyState>
        ) : (
          <DataTable
            table={table}
            rowKey={(b) => b.id}
            rowHref={fiche}
            rowActions={(b) => (
              <RowActions>
                <RowAction label="Voir dans la copropriété" icon={Eye} href={fiche(b)} />
                <RowAction label="Gérer niveaux et lots" icon={Pencil} href={fiche(b)} />
                <RowAction label="Supprimer" icon={Trash2} danger onClick={() => supprimer(b)} />
              </RowActions>
            )}
          />
        )}
      </div>
    </div>
  );
}
