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
import { Input, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
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

export function BatimentsLots({ coproprieteId }: { coproprieteId: string }) {
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

  const lotsFiltres = useMemo(
    () =>
      lots.filter(
        (l) =>
          (!fType || l.type === fType) &&
          (!fStatut || l.statut === fStatut) &&
          (!fBat || l.batimentId === fBat),
      ),
    [lots, fType, fStatut, fBat],
  );

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
      {/* ---- Bâtiments ---- */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Bâtiments & niveaux</h2>
            <p className="text-xs text-muted-foreground">
              {batiments.length} bâtiment{batiments.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" onClick={() => setModal({ kind: 'batiment' })}>
            <Plus className="h-4 w-4" /> Ajouter un bâtiment
          </Button>
        </div>

        {batiments.length === 0 ? (
          <Empty icon={Building2} title="Aucun bâtiment" desc="Ajoutez un premier bâtiment." />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {batiments.map((b) => (
              <div key={b.id} className="rounded-lg border border-border p-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-primary" /> {b.nom}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Tooltip label="Ajouter un niveau">
                      <button
                        onClick={() => setModal({ kind: 'niveau', batimentId: b.id })}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Renommer">
                      <button
                        onClick={() => setModal({ kind: 'batiment', batiment: b })}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip label="Supprimer">
                      <button
                        onClick={() => supprimerBatiment(b)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {(niveaux[b.id] ?? []).length === 0 ? (
                    <span className="text-xs text-muted-foreground">Aucun niveau</span>
                  ) : (
                    (niveaux[b.id] ?? []).map((n) => (
                      <span
                        key={n.id}
                        className="group inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        {n.nom}
                        <button
                          onClick={() => supprimerNiveau(n)}
                          className="text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100"
                          aria-label="Supprimer le niveau"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---- Lots ---- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Lots</h2>
            <p className="text-xs text-muted-foreground">
              {lots.length} lot{lots.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/coproprietes/${coproprieteId}/lots/nouveau`}>
              <Plus className="h-4 w-4" /> Nouveau lot
            </Link>
          </Button>
        </div>

        {/* filtres */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SearchSelect
            className="w-44"
            value={fType}
            onChange={setFType}
            options={LOT_TYPES}
            allowEmpty
            emptyLabel="Tous les types"
          />
          <SearchSelect
            className="w-56"
            value={fStatut}
            onChange={setFStatut}
            options={LOT_STATUTS}
            allowEmpty
            emptyLabel="Tous les statuts"
          />
          <SearchSelect
            className="w-44"
            value={fBat}
            onChange={setFBat}
            options={batiments.map((b) => [b.id, b.nom] as const)}
            allowEmpty
            emptyLabel="Tous les bâtiments"
          />
          <span className="ml-auto text-sm text-muted-foreground">
            {lotsFiltres.length} résultat{lotsFiltres.length > 1 ? 's' : ''}
          </span>
        </div>

        {lotsFiltres.length === 0 ? (
          <Empty
            icon={Home}
            title="Aucun lot"
            desc={lots.length === 0 ? 'Ajoutez votre premier lot.' : 'Aucun résultat pour ces filtres.'}
          />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="border border-border px-3 py-2.5 font-semibold">Réf.</th>
                  <th className="border border-border px-3 py-2.5 font-semibold">Type</th>
                  <th className="border border-border px-3 py-2.5 font-semibold">Superficie</th>
                  <th className="border border-border px-3 py-2.5 font-semibold">Bâtiment</th>
                  <th className="border border-border px-3 py-2.5 font-semibold">Statut</th>
                  <th className="border border-border px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lotsFiltres.map((l) => (
                  <tr key={l.id} className="bg-card transition-colors hover:bg-muted/50">
                    <td className="border border-border px-3 py-2.5 font-medium">{l.reference}</td>
                    <td className="border border-border px-3 py-2.5">{LABELS[l.type] ?? l.type}</td>
                    <td className="border border-border px-3 py-2.5 text-muted-foreground">
                      {l.superficie ? `${l.superficie} m²` : '—'}
                    </td>
                    <td className="border border-border px-3 py-2.5 text-muted-foreground">
                      {batNom(l.batimentId)}
                    </td>
                    <td className="border border-border px-3 py-2.5">
                      <Badge tone={LOT_STATUT_TONE[l.statut] ?? 'neutral'} dot>
                        {LABELS[l.statut] ?? l.statut}
                      </Badge>
                    </td>
                    <td className="border border-border px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip label="Voir">
                          <button
                            onClick={() => setModal({ kind: 'lot-voir', lot: l })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </Tooltip>
                        <Tooltip label="Modifier">
                          <Link
                            href={`/coproprietes/${coproprieteId}/lots/${l.id}/modifier`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Tooltip>
                        <Tooltip label="Supprimer">
                          <button
                            onClick={() => supprimerLot(l)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card className="w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </Card>
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
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal title={batiment ? 'Renommer le bâtiment' : 'Nouveau bâtiment'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Nom du bâtiment *</Label>
          <Input required autoFocus value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Bâtiment A" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner />} {batiment ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
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
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/batiments/${batimentId}/niveaux`, {
        method: 'POST',
        body: JSON.stringify({ nom, ordre }),
      });
      onDone();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal title="Nouveau niveau" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Nom du niveau *</Label>
          <Input required autoFocus value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. RDC, 1er étage" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Spinner />} Créer
          </Button>
        </div>
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
      <dl className="space-y-2.5 text-sm">
        <Row label="Type" value={LABELS[lot.type] ?? lot.type} />
        <Row label="Désignation" value={lot.designation ?? '—'} />
        <Row label="Superficie" value={lot.superficie ? `${lot.superficie} m²` : '—'} />
        <Row label="Bâtiment" value={batNom} />
        <Row label="Statut" value={LABELS[lot.statut] ?? lot.statut} />
      </dl>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
