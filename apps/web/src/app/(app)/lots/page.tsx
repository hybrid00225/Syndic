'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Pencil, Trash2, Printer, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import type { CoproRef, Lot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ledger, Stat, Composition, Ring } from '@/components/ui/stat';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { Sheet, DefList } from '@/components/ui/sheet';
import { ListToolbar, Pagination, RowAction, RowActions, SearchInput, usePaged } from '@/components/ui/list';
import { PageHeader } from '@/components/page-header';
import { exportCsv } from '@/lib/csv';
import { LOT_TYPES, LOT_STATUTS, LOT_STATUT_TONE, LABELS } from '@/lib/constants';

const surface = (s: string | null) =>
  s ? `${Number(s).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m²` : '—';

export default function LotsPage() {
  const confirm = useConfirm();
  const alert = useAlert();
  const invalidate = useInvalidate();
  const { data: lots, error, isLoading, refetch } = useApi<Lot[]>('/lots');
  const { data: copros = [] } = useApi<CoproRef[]>('/coproprietes');
  const [q, setQ] = useState('');
  const [copro, setCopro] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [voir, setVoir] = useState<Lot | null>(null);

  const filtered = useMemo(() => {
    if (!lots) return [];
    const n = q.trim().toLowerCase();
    return lots
      .filter(
        (l) =>
          (!n || l.reference.toLowerCase().includes(n) || (l.designation ?? '').toLowerCase().includes(n)) &&
          (!copro || l.coproprieteId === copro) &&
          (!type || l.type === type) &&
          (!statut || l.statut === statut),
      )
      .sort((a, b) => a.reference.localeCompare(b.reference, 'fr', { numeric: true }));
  }, [lots, q, copro, type, statut]);

  const paged = usePaged(filtered, 10, `${q}|${copro}|${type}|${statut}`);

  if (isLoading) return <PageLoader label="Chargement des lots…" />;

  const header = (
    <PageHeader
      crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Lots' }]}
      title="Lots"
      subtitle="Appartements, parkings, commerces… de toutes vos copropriétés."
      actions={
        lots && lots.length > 0 ? (
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

  if (error || !lots) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title="Aucun lot déclaré"
          steps={['Ouvrir une copropriété', 'Déclarer bâtiments et niveaux', 'Ajouter les lots et leurs propriétaires']}
          actions={
            <Button asChild>
              <Link href="/coproprietes">Aller aux copropriétés</Link>
            </Button>
          }
        >
          Un lot est une partie privative (appartement, parking, cave, commerce…) à laquelle sont
          attachés des tantièmes et un ou plusieurs propriétaires.
        </EmptyState>
      </div>
    );
  }

  const count = (s: string) => lots.filter((l) => l.statut === s).length;
  const occupes = count('OCCUPE_PROPRIETAIRE') + count('LOUE');
  const hasFilters = !!(q || copro || type || statut);

  const reset = () => {
    setQ('');
    setCopro('');
    setType('');
    setStatut('');
  };

  function exporter() {
    exportCsv(
      'lots.csv',
      ['Référence', 'Copropriété', 'Type', 'Désignation', 'Superficie (m²)', 'Bâtiment', 'Statut'],
      filtered.map((l) => [
        l.reference,
        l.copropriete?.nom,
        LABELS[l.type] ?? l.type,
        l.designation,
        l.superficie,
        l.batiment?.nom,
        LABELS[l.statut] ?? l.statut,
      ]),
    );
  }

  const supprimer = async (l: Lot) => {
    const ok = await confirm({
      title: `Supprimer le lot « ${l.reference} » ?`,
      description: `Lot de « ${l.copropriete?.nom ?? ''} ». La suppression est définitive.`,
      nextAction: 'Impossible si le lot est rattaché à un propriétaire, des tantièmes ou des appels de fonds.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/lots/${l.id}`, { method: 'DELETE' });
      setVoir(null);
      invalidate('/lots', '/coproprietes', '/batiments');
    } catch (e) {
      alert('Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  const modifier = (l: Lot) => `/coproprietes/${l.coproprieteId}/lots/${l.id}/modifier`;

  return (
    <div className="space-y-6">
      {header}

      <Ledger>
        <Stat
          lead
          label="Lots"
          value={lots.length}
          info="Tous les lots de vos copropriétés, par statut d'occupation. Cliquez pour retirer le filtre de statut."
          onClick={() => setStatut('')}
          active={!statut}
          viz={
            <Composition
              segments={[
                { label: 'Occupés', value: occupes, tone: 'ink' },
                { label: 'Vacants', value: count('VACANT'), tone: 'warn' },
                { label: 'Indisponibles', value: count('EN_TRAVAUX') + count('INDISPONIBLE'), tone: 'soft' },
                { label: 'Vendus', value: count('VENDU'), tone: 'empty' },
              ]}
            />
          }
        />
        <Stat
          label="Taux d'occupation"
          value={occupes}
          unit={`/ ${lots.length}`}
          info="Lots occupés par leur propriétaire ou loués."
          aside={<Ring value={occupes / lots.length} />}
          note={`${count('LOUE')} loué${count('LOUE') > 1 ? 's' : ''} · ${count('OCCUPE_PROPRIETAIRE')} occupé${count('OCCUPE_PROPRIETAIRE') > 1 ? 's' : ''} par le propriétaire`}
        />
        <Stat
          label="Vacants"
          value={count('VACANT')}
          tone={count('VACANT') > 0 ? 'warning' : 'default'}
          info="Lots sans occupant. Cliquez pour filtrer."
          onClick={() => setStatut(statut === 'VACANT' ? '' : 'VACANT')}
          active={statut === 'VACANT'}
          note={count('VACANT') > 0 ? 'à louer ou à suivre' : 'aucun lot vacant'}
        />
        <Stat
          label="Sans bâtiment"
          value={lots.filter((l) => !l.batimentId).length}
          info="Lots non rattachés à un bâtiment : à localiser pour les répartitions par bâtiment."
          note="à localiser"
        />
      </Ledger>

      <div className="space-y-4">
        <ListToolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="Référence ou désignation…" />}
          hasFilters={hasFilters}
          onReset={reset}
          count={filtered.length}
        >
          <SearchSelect size="sm" className="w-52" value={copro} onChange={setCopro} options={copros.map((c) => [c.id, c.nom] as const)} allowEmpty emptyLabel="Toutes les copropriétés" aria-label="Filtrer par copropriété" />
          <SearchSelect size="sm" className="w-40" value={type} onChange={setType} options={LOT_TYPES} allowEmpty emptyLabel="Tous les types" aria-label="Filtrer par type" />
          <SearchSelect size="sm" className="w-52" value={statut} onChange={setStatut} options={LOT_STATUTS} allowEmpty emptyLabel="Tous les statuts" aria-label="Filtrer par statut" />
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
            Aucun lot ne correspond à ces critères.
          </EmptyState>
        ) : (
          <Table footer={<Pagination {...paged} />}>
            <THead>
              <Th>Lot</Th>
              <Th>Copropriété</Th>
              <Th>Bâtiment</Th>
              <Th numeric>Superficie</Th>
              <Th>Statut</Th>
              <Th className="no-print w-[1%]">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <tbody>
              {paged.pageItems.map((l) => (
                <Tr key={l.id} onOpen={() => setVoir(l)}>
                  <Td>
                    <button
                      type="button"
                      onClick={() => setVoir(l)}
                      className="text-left font-medium underline-offset-4 hover:underline"
                    >
                      {l.reference}
                    </button>
                    <p className="text-2xs text-muted-foreground">
                      {[LABELS[l.type] ?? l.type, l.designation].filter(Boolean).join(' · ')}
                    </p>
                  </Td>
                  <Td>
                    <Link href={`/coproprietes/${l.coproprieteId}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                      {l.copropriete?.nom}
                    </Link>
                  </Td>
                  <Td className={l.batiment ? '' : 'text-muted-foreground/60'}>{l.batiment?.nom ?? '—'}</Td>
                  <Td numeric>{surface(l.superficie)}</Td>
                  <Td>
                    <Badge tone={LOT_STATUT_TONE[l.statut] ?? 'neutral'}>{LABELS[l.statut] ?? l.statut}</Badge>
                  </Td>
                  <Td>
                    <RowActions>
                      <RowAction label="Aperçu" icon={Eye} onClick={() => setVoir(l)} />
                      <RowAction label="Modifier" icon={Pencil} href={modifier(l)} />
                      <RowAction label="Supprimer" icon={Trash2} danger onClick={() => supprimer(l)} />
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <Sheet
        open={!!voir}
        onClose={() => setVoir(null)}
        eyebrow={voir?.copropriete?.nom}
        title={voir ? `Lot ${voir.reference}` : ''}
        footer={
          voir && (
            <>
              <Button variant="secondary" onClick={() => supprimer(voir)}>
                <Trash2 className="h-4 w-4" /> Supprimer
              </Button>
              <Button asChild>
                <Link href={modifier(voir)}>
                  <Pencil className="h-4 w-4" /> Modifier
                </Link>
              </Button>
            </>
          )
        }
      >
        {voir && (
          <>
            <Badge tone={LOT_STATUT_TONE[voir.statut] ?? 'neutral'}>{LABELS[voir.statut] ?? voir.statut}</Badge>
            <div className="mt-4">
              <DefList
                items={[
                  ['Type', LABELS[voir.type] ?? voir.type],
                  ['Désignation', voir.designation ?? '—'],
                  ['Superficie', surface(voir.superficie)],
                  ['Bâtiment', voir.batiment?.nom ?? '—'],
                  [
                    'Copropriété',
                    <Link key="c" href={`/coproprietes/${voir.coproprieteId}`} className="text-primary underline-offset-4 hover:underline">
                      {voir.copropriete?.nom}
                    </Link>,
                  ],
                ]}
              />
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}
