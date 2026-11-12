'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Building2,
  Home,
  Pencil,
  Trash2,
  Layers,
  X,
  Eye,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input } from '@/components/ui/input';
import { Modal, ModalActions } from '@/components/ui/modal';
import { FormError } from '@/components/ui/alert';
import { IconButton } from '@/components/ui/icon-button';
import { DefList } from '@/components/ui/sheet';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { ColumnsMenu, DataTable, TableExport, useDataTable, type Column } from '@/components/ui/data-table';
import { ListToolbar, RowAction, RowActions, SearchInput } from '@/components/ui/list';
import { EmptyState } from '@/components/ui/states';
import { cn } from '@/lib/utils';
import { LOT_TYPES, LOT_STATUTS, LOT_STATUT_TONE, LABELS } from '@/lib/constants';

interface Batiment {
  id: string;
  nom: string;
}
interface Niveau {
  id: string;
  nom: string;
  ordre: number;
}
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

// Couleur des cases-lots dans l'élévation (par statut d'occupation).
const CELL: Record<string, string> = {
  OCCUPE_PROPRIETAIRE: 'border-primary bg-primary text-primary-foreground',
  LOUE: 'border-primary/50 bg-primary/30 text-foreground',
  VACANT: 'border-input bg-background text-foreground',
  EN_TRAVAUX: 'border-warning bg-warning/60 text-foreground',
  INDISPONIBLE: 'border-warning text-foreground bg-[repeating-linear-gradient(45deg,hsl(var(--warning)/0.35)_0_3px,transparent_3px_7px)]',
  VENDU: 'border-border bg-muted text-muted-foreground line-through',
};
const LEGENDE: [string, string][] = [
  ['OCCUPE_PROPRIETAIRE', 'Occupé par le propriétaire'],
  ['LOUE', 'Loué'],
  ['VACANT', 'Vacant'],
  ['EN_TRAVAUX', 'En travaux'],
  ['INDISPONIBLE', 'Indisponible'],
  ['VENDU', 'Vendu'],
];

export type PatrimoineView = 'batiments' | 'lots';

/**
 * Patrimoine d'une copropriété : rendu en deux onglets (bâtiments / lots)
 * qui partagent données, filtres et fenêtres. Garder une seule instance montée
 * pour que le filtre posé depuis un étage suive vers l'onglet Lots.
 */
export function BatimentsLots({
  coproprieteId,
  coproprieteNom,
  view,
  onViewChange,
}: {
  coproprieteId: string;
  /** Sous-titre des documents exportés. */
  coproprieteNom: string;
  view: PatrimoineView;
  onViewChange: (v: PatrimoineView) => void;
}) {
  const confirm = useConfirm();
  const [batiments, setBatiments] = useState<Batiment[]>([]);
  const [niveaux, setNiveaux] = useState<Record<string, Niveau[]>>({});
  const [lots, setLots] = useState<Lot[]>([]);
  const [modal, setModal] = useState<
    | { kind: 'batiment'; batiment?: Batiment }
    | { kind: 'niveau'; batimentId: string }
    | { kind: 'lot-voir'; lot: Lot }
    | null
  >(null);
  const [fType, setFType] = useState('');
  const [fStatut, setFStatut] = useState('');
  const [fBat, setFBat] = useState('');
  const [fNiv, setFNiv] = useState('');
  const [q, setQ] = useState('');

  const chargerBatiments = async () => {
    const bs = await api<Batiment[]>(`/coproprietes/${coproprieteId}/batiments`);
    setBatiments(bs);
    const map: Record<string, Niveau[]> = {};
    await Promise.all(
      bs.map(async (b) => {
        map[b.id] = await api<Niveau[]>(`/batiments/${b.id}/niveaux`).catch(() => []);
      }),
    );
    setNiveaux(map);
  };
  const chargerLots = () =>
    api<Lot[]>(`/coproprietes/${coproprieteId}/lots`).then(setLots).catch(() => setLots([]));

  useEffect(() => {
    chargerBatiments();
    chargerLots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coproprieteId]);

  const batNom = (id: string | null) =>
    id ? batiments.find((b) => b.id === id)?.nom ?? '—' : '—';

  const lotsFiltres = useMemo(() => {
    const n = q.trim().toLowerCase();
    return lots.filter(
      (l) =>
        (!n || l.reference.toLowerCase().includes(n) || (l.designation ?? '').toLowerCase().includes(n)) &&
        (!fType || l.type === fType) &&
        (!fStatut || l.statut === fStatut) &&
        (!fBat || l.batimentId === fBat) &&
        (!fNiv || (fNiv === '__none' ? !l.niveauId : l.niveauId === fNiv)),
    );
  }, [lots, q, fType, fStatut, fBat, fNiv]);

  const nivNom = (id: string | null) => {
    if (!id) return null;
    for (const list of Object.values(niveaux)) {
      const n = list.find((x) => x.id === id);
      if (n) return n.nom;
    }
    return null;
  };
  const lotColumns: Column<Lot>[] = [
    {
      id: 'reference',
      header: 'Lot',
      required: true,
      value: (l) => l.reference,
      cell: (l) => (
        <>
          <button
            type="button"
            onClick={() => setModal({ kind: 'lot-voir', lot: l })}
            className="text-left font-medium underline-offset-4 hover:underline"
          >
            {l.reference}
          </button>
          <p className="text-2xs text-muted-foreground">
            {[LABELS[l.type] ?? l.type, l.designation].filter(Boolean).join(' · ')}
          </p>
        </>
      ),
    },
    { id: 'type', header: 'Type', defaultHidden: true, value: (l) => LABELS[l.type] ?? l.type, cell: (l) => LABELS[l.type] ?? l.type },
    { id: 'designation', header: 'Désignation', defaultHidden: true, value: (l) => l.designation, cell: (l) => l.designation ?? '—' },
    {
      id: 'batiment',
      header: 'Bâtiment',
      value: (l) => (l.batimentId ? batNom(l.batimentId) : null),
      cell: (l) => <span className={l.batimentId ? '' : 'text-muted-foreground/60'}>{batNom(l.batimentId)}</span>,
    },
    {
      id: 'niveau',
      header: 'Niveau',
      value: (l) => nivNom(l.niveauId),
      cell: (l) => <span className="text-muted-foreground">{nivNom(l.niveauId) ?? '—'}</span>,
    },
    {
      id: 'superficie',
      header: 'Superficie (m²)',
      numeric: true,
      value: (l) => (l.superficie ? Number(l.superficie) : null),
      cell: (l) => (
        <span className={l.superficie ? '' : 'text-muted-foreground/50'}>
          {l.superficie ? `${Number(l.superficie).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m²` : '—'}
        </span>
      ),
    },
    {
      id: 'statut',
      header: 'Statut',
      value: (l) => LABELS[l.statut] ?? l.statut,
      cell: (l) => <Badge tone={LOT_STATUT_TONE[l.statut] ?? 'neutral'}>{LABELS[l.statut] ?? l.statut}</Badge>,
    },
  ];
  const lotTable = useDataTable({
    id: 'copropriete-lots',
    rows: lotsFiltres,
    columns: lotColumns,
    defaultSort: { id: 'reference', dir: 'asc' },
    resetKey: `${q}|${fType}|${fStatut}|${fBat}|${fNiv}`,
  });
  const lotFiltres = [
    q && `Recherche : « ${q} »`,
    fType && `Type : ${LABELS[fType] ?? fType}`,
    fStatut && `Statut : ${LABELS[fStatut] ?? fStatut}`,
    fBat && `Bâtiment : ${batNom(fBat)}`,
    fNiv && `Niveau : ${fNiv === '__none' ? 'sans niveau' : nivNom(fNiv) ?? ''}`,
  ].filter(Boolean) as string[];

  const filtrerEtage = (batimentId: string, niveauId: string) => {
    const same = fBat === batimentId && fNiv === niveauId;
    setFBat(same ? '' : batimentId);
    setFNiv(same ? '' : niveauId);
    if (!same) onViewChange('lots');
  };
  const hasLotFilters = !!(q || fType || fStatut || fBat || fNiv);
  const resetLots = () => {
    setQ('');
    setFType('');
    setFStatut('');
    setFBat('');
    setFNiv('');
  };

  const supprimerBatiment = async (b: Batiment) => {
    const ok = await confirm({
      title: `Supprimer « ${b.nom} » ?`,
      description: 'Le bâtiment sera définitivement supprimé.',
      nextAction: "Impossible s'il contient encore des niveaux ou des lots.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/batiments/${b.id}`, { method: 'DELETE' });
      chargerBatiments();
    } catch (e) {
      await confirm({
        title: 'Suppression impossible',
        description: e instanceof Error ? e.message : 'Erreur',
        confirmLabel: 'Compris',
        cancelLabel: 'Fermer',
        tone: 'warning',
      });
    }
  };

  const supprimerNiveau = async (n: Niveau) => {
    const ok = await confirm({
      title: `Supprimer le niveau « ${n.nom} » ?`,
      description: 'Le niveau sera supprimé.',
      nextAction: "Impossible s'il contient des lots.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/niveaux/${n.id}`, { method: 'DELETE' });
      chargerBatiments();
    } catch (e) {
      await confirm({
        title: 'Suppression impossible',
        description: e instanceof Error ? e.message : 'Erreur',
        confirmLabel: 'Compris',
        tone: 'warning',
      });
    }
  };

  const supprimerLot = async (l: Lot) => {
    const ok = await confirm({
      title: `Supprimer le lot « ${l.reference} » ?`,
      description: 'Le lot sera définitivement supprimé.',
      nextAction:
        'Impossible si le lot est déjà rattaché à un propriétaire, des tantièmes ou des appels de fonds.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/lots/${l.id}`, { method: 'DELETE' });
      chargerLots();
    } catch (e) {
      await confirm({
        title: 'Suppression impossible',
        description: e instanceof Error ? e.message : 'Erreur',
        confirmLabel: 'Compris',
        tone: 'warning',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ---- Bâtiments : élévations ---- */}
      {view === 'batiments' && (
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-medium">Bâtiments</h2>
            <p className="text-ui text-muted-foreground">
              Chaque case est un lot, placé à son étage. Cliquez un étage pour voir ses lots.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setModal({ kind: 'batiment' })}>
            <Plus className="h-4 w-4" /> Ajouter un bâtiment
          </Button>
        </div>

        {batiments.length === 0 ? (
          <EmptyState
            title="Aucun bâtiment"
            steps={['Ajouter un bâtiment', 'Déclarer ses niveaux (RDC, R+1…)', 'Créer les lots à chaque niveau']}
            actions={
              <Button onClick={() => setModal({ kind: 'batiment' })}>
                <Plus className="h-4 w-4" /> Ajouter un bâtiment
              </Button>
            }
          >
            Les bâtiments structurent la copropriété : chacun se découpe en niveaux qui accueillent les lots.
          </EmptyState>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {batiments.map((b) => {
              const nivs = [...(niveaux[b.id] ?? [])].sort((x, y) => y.ordre - x.ordre);
              const lotsBat = lots.filter((l) => l.batimentId === b.id);
              const sansNiveau = lotsBat.filter((l) => !l.niveauId);
              const occ = lotsBat.filter((l) => l.statut === 'OCCUPE_PROPRIETAIRE' || l.statut === 'LOUE').length;
              const etages: { id: string; nom: string; lots: Lot[]; niveau?: Niveau }[] = [
                ...nivs.map((n) => ({ id: n.id, nom: n.nom, niveau: n, lots: lotsBat.filter((l) => l.niveauId === n.id) })),
                ...(sansNiveau.length ? [{ id: '__none', nom: '—', lots: sansNiveau }] : []),
              ];
              return (
                <Card key={b.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3 px-5 pt-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-medium leading-tight">{b.nom}</h3>
                      <p className="nums mt-0.5 text-2xs text-muted-foreground">
                        {nivs.length} niveau{nivs.length > 1 ? 'x' : ''} · {lotsBat.length} lot{lotsBat.length > 1 ? 's' : ''}
                        {lotsBat.length > 0 && ` · ${Math.round((occ / lotsBat.length) * 100)} % occupés`}
                      </p>
                    </div>
                    <RowActions>
                      <RowAction label="Ajouter un niveau" icon={Plus} onClick={() => setModal({ kind: 'niveau', batimentId: b.id })} />
                      <RowAction label="Renommer le bâtiment" icon={Pencil} onClick={() => setModal({ kind: 'batiment', batiment: b })} />
                      <RowAction label="Supprimer le bâtiment" icon={Trash2} danger onClick={() => supprimerBatiment(b)} />
                    </RowActions>
                  </div>

                  {/* Façade : toit, murs, étages, sol */}
                  <div className="flex-1 px-5 pb-4 pt-3">
                    {etages.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setModal({ kind: 'niveau', batimentId: b.id })}
                        className="w-full rounded-md border border-dashed border-input px-4 py-8 text-left text-ui text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        Aucun niveau déclaré.{' '}
                        <span className="font-medium text-primary">Ajouter le rez-de-chaussée →</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-[3.75rem_minmax(0,1fr)]">
                        {/* Toit */}
                        <span />
                        <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden className="block h-5 w-full text-foreground/80">
                          <path d="M0 12 L50 1 L100 12" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                        </svg>

                        {etages.map((e) => {
                          const actif = fBat === b.id && fNiv === e.id;
                          const vac = e.lots.filter((l) => l.statut === 'VACANT').length;
                          return (
                            <div key={e.id} className="contents group/etage">
                              <button
                                type="button"
                                onClick={() => filtrerEtage(b.id, e.id)}
                                aria-pressed={actif}
                                title={`Voir les lots ${e.id === '__none' ? 'sans niveau' : 'de ' + e.nom}`}
                                className={cn(
                                  'flex flex-col items-end justify-center pr-2.5 text-right transition-colors hover:text-foreground',
                                  actif ? 'text-foreground' : 'text-muted-foreground',
                                )}
                              >
                                <span className="nums text-ui font-semibold leading-none">
                                  {e.id === '__none' ? 'Sans niv.' : e.nom}
                                </span>
                                <span className="nums mt-0.5 text-[0.625rem] leading-none">
                                  {e.lots.length} lot{e.lots.length > 1 ? 's' : ''}
                                  {vac > 0 && ` · ${vac} vac.`}
                                </span>
                              </button>
                              <div
                                className={cn(
                                  'relative flex min-h-[2.75rem] flex-wrap items-center gap-1 border-x-2 border-t border-x-foreground/80 border-t-border px-1.5 py-1.5',
                                  e.id === '__none' && 'border-dashed border-x-foreground/30',
                                  actif && 'bg-muted/70',
                                )}
                              >
                                {e.lots.length === 0 ? (
                                  <span className="px-1 text-2xs text-muted-foreground/60">aucun lot à ce niveau</span>
                                ) : (
                                  e.lots
                                    .sort((x, y) => x.reference.localeCompare(y.reference, 'fr', { numeric: true }))
                                    .map((l) => (
                                      <Tooltip
                                        key={l.id}
                                        className="min-w-[3.25rem] flex-1"
                                        label={`${l.reference} · ${LABELS[l.type] ?? l.type} · ${LABELS[l.statut] ?? l.statut}`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => setModal({ kind: 'lot-voir', lot: l })}
                                          aria-label={`Lot ${l.reference}, ${LABELS[l.statut] ?? l.statut}`}
                                          className={cn(
                                            'nums flex h-8 w-full items-center justify-center rounded-[3px] border text-2xs font-semibold transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[0_2px_0_0_hsl(var(--foreground)/0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                            CELL[l.statut] ?? CELL.VACANT,
                                          )}
                                        >
                                          {l.reference}
                                        </button>
                                      </Tooltip>
                                    ))
                                )}
                                {e.niveau && e.lots.length === 0 && (
                                  <IconButton
                                    label={`Supprimer le niveau ${e.nom}`}
                                    icon={X}
                                    size="xs"
                                    tone="danger"
                                    onClick={() => supprimerNiveau(e.niveau!)}
                                    className="ml-auto opacity-0 focus-visible:opacity-100 group-hover/etage:opacity-100"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Sol */}
                        <span />
                        <span aria-hidden className="-mx-3 block h-[3px] rounded-full bg-foreground/80" />
                      </div>
                    )}
                  </div>

                  {/* Synthèse du bâtiment */}
                  <dl className="grid grid-cols-4 border-t border-border">
                    {[
                      ['Lots', lotsBat.length, ''],
                      ['Occupés', occ, ''],
                      ['Vacants', lotsBat.filter((l) => l.statut === 'VACANT').length, 'text-warning'],
                      [
                        'Surface',
                        lotsBat.some((l) => l.superficie)
                          ? `${lotsBat.reduce((t, l) => t + Number(l.superficie ?? 0), 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} m²`
                          : '—',
                        '',
                      ],
                    ].map(([k, v, tone]) => (
                      <div key={k as string} className="border-r border-border px-4 py-2.5 last:border-r-0">
                        <dt className="text-2xs text-muted-foreground">{k}</dt>
                        <dd className={cn('nums font-display text-lg leading-tight', Number(v) > 0 && (tone as string))}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              );
            })}
          </div>
        )}

        {/* Légende */}
        {lots.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-muted-foreground">
            {LEGENDE.map(([k, label]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={cn('h-3 w-3 rounded-[2px] border', CELL[k])} />
                {label}
              </span>
            ))}
          </div>
        )}
      </section>
      )}

      {/* ---- Lots ---- */}
      {view === 'lots' && (
      <section id="lots-table" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-medium">Lots</h2>
            <p className="text-ui text-muted-foreground">
              {lots.length} lot{lots.length > 1 ? 's' : ''} dans cette copropriété.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TableExport
              table={lotTable}
              title="Lots"
              subtitle={coproprieteNom}
              filters={lotFiltres}
              filename="lots-copropriete"
            />
            <Button asChild size="sm">
              <Link href={`/coproprietes/${coproprieteId}/lots/nouveau`}>
                <Plus className="h-4 w-4" /> Nouveau lot
              </Link>
            </Button>
          </div>
        </div>

        <ListToolbar
          search={<SearchInput value={q} onChange={setQ} placeholder="Référence ou désignation…" />}
          hasFilters={hasLotFilters}
          onReset={resetLots}
          count={lotsFiltres.length}
          tools={<ColumnsMenu table={lotTable} />}
        >
          <SearchSelect size="sm" className="w-40" value={fType} onChange={setFType} options={LOT_TYPES} allowEmpty emptyLabel="Tous les types" aria-label="Filtrer par type" />
          <SearchSelect size="sm" className="w-52" value={fStatut} onChange={setFStatut} options={LOT_STATUTS} allowEmpty emptyLabel="Tous les statuts" aria-label="Filtrer par statut" />
          <SearchSelect
            size="sm"
            className="w-44"
            value={fBat}
            onChange={(v) => {
              setFBat(v);
              setFNiv('');
            }}
            options={batiments.map((x) => [x.id, x.nom] as const)}
            allowEmpty
            emptyLabel="Tous les bâtiments"
            aria-label="Filtrer par bâtiment"
          />
          {fBat && (
            <SearchSelect
              size="sm"
              className="w-36"
              value={fNiv}
              onChange={setFNiv}
              options={[...(niveaux[fBat] ?? [])].sort((x, y) => x.ordre - y.ordre).map((n) => [n.id, n.nom] as const)}
              allowEmpty
              emptyLabel="Tous niveaux"
              aria-label="Filtrer par niveau"
            />
          )}
        </ListToolbar>

        {lotsFiltres.length === 0 ? (
          <Empty
            icon={Home}
            title="Aucun lot"
            desc={lots.length === 0 ? 'Ajoutez votre premier lot.' : 'Aucun résultat pour ces filtres.'}
          />
        ) : (
          <DataTable
            table={lotTable}
            rowKey={(l) => l.id}
            onRowOpen={(l) => setModal({ kind: 'lot-voir', lot: l })}
            rowActions={(l) => (
              <RowActions>
                <RowAction label="Aperçu" icon={Eye} onClick={() => setModal({ kind: 'lot-voir', lot: l })} />
                <RowAction label="Modifier" icon={Pencil} href={`/coproprietes/${coproprieteId}/lots/${l.id}/modifier`} />
                <RowAction label="Supprimer" icon={Trash2} danger onClick={() => supprimerLot(l)} />
              </RowActions>
            )}
          />
        )}
      </section>
      )}

      {/* ---- Modals ---- */}
      {modal?.kind === 'batiment' && (
        <BatimentModal
          coproprieteId={coproprieteId}
          batiment={modal.batiment}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            chargerBatiments();
          }}
        />
      )}
      {modal?.kind === 'niveau' && (
        <NiveauModal
          batimentId={modal.batimentId}
          ordre={(niveaux[modal.batimentId] ?? []).length}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            chargerBatiments();
          }}
        />
      )}
      {modal?.kind === 'lot-voir' && (
        <LotVoirModal lot={modal.lot} batNom={batNom(modal.lot.batimentId)} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function Empty({ icon: Icon, title, desc }: { icon: typeof Home; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function BatimentModal({
  coproprieteId,
  batiment,
  onClose,
  onDone,
}: {
  coproprieteId: string;
  batiment?: Batiment;
  onClose: () => void;
  onDone: () => void;
}) {
  const [nom, setNom] = useState(batiment?.nom ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (batiment) {
        await api(`/batiments/${batiment.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ nom }),
        });
      } else {
        await api(`/coproprietes/${coproprieteId}/batiments`, {
          method: 'POST',
          body: JSON.stringify({ nom }),
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal title={batiment ? 'Renommer le bâtiment' : 'Nouveau bâtiment'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom du bâtiment" required>
          <Input required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Bâtiment A" />
        </Field>
        <FormError error={error} />
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner />} {batiment ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

function NiveauModal({
  batimentId,
  ordre,
  onClose,
  onDone,
}: {
  batimentId: string;
  ordre: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api(`/batiments/${batimentId}/niveaux`, {
        method: 'POST',
        body: JSON.stringify({ nom, ordre }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal title="Nouveau niveau" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom du niveau" required>
          <Input required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. RDC, 1er étage" />
        </Field>
        <FormError error={error} />
        <ModalActions>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner />} Créer
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

function LotVoirModal({
  lot,
  batNom,
  onClose,
}: {
  lot: Lot;
  batNom: string;
  onClose: () => void;
}) {
  return (
    <Modal title={`Lot ${lot.reference}`} onClose={onClose}>
      <DefList
        items={[
          ['Type', LABELS[lot.type] ?? lot.type],
          ['Désignation', lot.designation ?? '—'],
          ['Superficie', lot.superficie ? `${lot.superficie} m²` : '—'],
          ['Bâtiment', batNom],
          ['Statut', LABELS[lot.statut] ?? lot.statut],
        ]}
      />
    </Modal>
  );
}
