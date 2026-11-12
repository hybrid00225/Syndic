'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Printer, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import type { Batiment, CoproRef } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Ledger, Stat, Composition } from '@/components/ui/stat';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { ListToolbar, Pagination, RowAction, RowActions, SearchInput, usePaged } from '@/components/ui/list';
import { PageHeader } from '@/components/page-header';
import { exportCsv } from '@/lib/csv';
import { cn } from '@/lib/utils';

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
      .sort((a, b) => a.copropriete.nom.localeCompare(b.copropriete.nom, 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  }, [batiments, q, copro, sansLot]);

  const paged = usePaged(filtered, 10, `${q}|${copro}|${sansLot}`);

  if (isLoading) return <PageLoader label="Chargement des bâtiments…" />;

  const header = (
    <PageHeader
      crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Bâtiments' }]}
      title="Bâtiments"
      subtitle="Tous les bâtiments de votre portefeuille. Ils se créent depuis la fiche de leur copropriété."
      actions={
        batiments && batiments.length > 0 ? (
          <>
            <Tooltip label="Imprimer la liste filtrée" side="bottom">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimer
              </Button>
            </Tooltip>
            <Tooltip label="Télécharger la liste filtrée (CSV, Excel)" side="bottom">
              <Button variant="secondary" onClick={() => exporter()}>
                <Download className="h-4 w-4" /> Exporter
              </Button>
            </Tooltip>
          </>
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

  function exporter() {
    exportCsv(
      'batiments.csv',
      ['Bâtiment', 'Copropriété', 'Niveaux', 'Lots'],
      filtered.map((b) => [b.nom, b.copropriete.nom, b._count.niveaux, b._count.lots]),
    );
  }

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

  const fiche = (b: Batiment) => `/coproprietes/${b.coproprieteId}?tab=batiments`;

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
          <Table footer={<Pagination {...paged} />}>
            <THead>
              <Th>Bâtiment</Th>
              <Th>Copropriété</Th>
              <Th numeric>Niveaux</Th>
              <Th numeric>Lots</Th>
              <Th className="no-print w-[1%]">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {paged.pageItems.map((b) => (
                <Tr key={b.id} href={fiche(b)}>
                  <Td>
                    <Link href={fiche(b)} className="font-medium underline-offset-4 hover:underline">
                      {b.nom}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/coproprietes/${b.coproprieteId}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      {b.copropriete.nom}
                    </Link>
                  </Td>
                  <Td numeric>{b._count.niveaux}</Td>
                  <Td numeric className={cn(b._count.lots === 0 && 'text-warning')}>
                    {b._count.lots}
                  </Td>
                  <Td>
                    <RowActions>
                      <RowAction label="Voir dans la copropriété" icon={Eye} href={fiche(b)} />
                      <RowAction label="Gérer niveaux et lots" icon={Pencil} href={fiche(b)} />
                      <RowAction label="Supprimer" icon={Trash2} danger onClick={() => supprimer(b)} />
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
