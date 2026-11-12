'use client';

import { useMemo, useState } from 'react';
import {
  Combine,
  Split,
  Link2,
  Unlink,
  Replace,
  Plus,
  Trash2,
  History,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Field } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Sheet } from '@/components/ui/sheet';
import { Spinner, PageLoader } from '@/components/ui/spinner';
import { useAlert } from '@/components/ui/confirm';
import { ErrorState } from '@/components/ui/states';
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LABELS, LOT_TYPES, LOT_STATUT_TONE } from '@/lib/constants';

interface LotOp {
  id: string;
  reference: string;
  type: string;
  superficie: string | null;
  statut: string;
  batimentId: string | null;
  lotPrincipalId: string | null;
  origineLotId: string | null;
}
interface Ref {
  id: string;
  nom: string;
}

const TERMINAUX = ['FUSIONNE', 'SUBDIVISE'];
const m2 = (s: string | null) => (s ? Number(s) : 0);

type NouveauLot = { reference: string; type: string; superficie: string; batimentId: string };
const nouveauVide = (type = 'APPARTEMENT'): NouveauLot => ({ reference: '', type, superficie: '', batimentId: '' });

type Op =
  | { kind: 'fusion' }
  | { kind: 'subdivision'; lot: LotOp }
  | { kind: 'annexer'; lot: LotOp }
  | { kind: 'destination'; lot: LotOp }
  | null;

export function LotOperations({ coproprieteId }: { coproprieteId: string }) {
  const { data, error, isLoading, refetch } = useApi<LotOp[]>(`/coproprietes/${coproprieteId}/lots`);
  const batiments = useApi<Ref[]>(`/coproprietes/${coproprieteId}/batiments`);
  const invalidate = useInvalidate();
  const alert = useAlert();

  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [op, setOp] = useState<Op>(null);
  const [saving, setSaving] = useState(false);

  const actifs = useMemo(() => (data ?? []).filter((l) => !TERMINAUX.includes(l.statut)), [data]);
  const historiques = useMemo(() => (data ?? []).filter((l) => TERMINAUX.includes(l.statut)), [data]);
  const batOptions = (batiments.data ?? []).map((b) => [b.id, b.nom] as const);

  if (isLoading) return <PageLoader label="Chargement des lots…" />;
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const refresh = () => {
    invalidate(`/coproprietes/${coproprieteId}/lots`);
    setSelection(new Set());
  };

  const toggle = (id: string) =>
    setSelection((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectionLots = actifs.filter((l) => selection.has(l.id));

  const erreur = (e: unknown) =>
    alert('Opération impossible', e instanceof Error ? e.message : 'Erreur inconnue.');

  // Change la destination (type) directement.
  const changerDestination = async (lot: LotOp, type: string) => {
    setSaving(true);
    try {
      await api(`/lots/${lot.id}/destination`, { method: 'PATCH', body: JSON.stringify({ type }) });
      setOp(null);
      refresh();
    } catch (e) {
      erreur(e);
    } finally {
      setSaving(false);
    }
  };

  const annexer = async (lot: LotOp, lotPrincipalId: string) => {
    setSaving(true);
    try {
      await api(`/lots/${lot.id}/annexer`, { method: 'PATCH', body: JSON.stringify({ lotPrincipalId }) });
      setOp(null);
      refresh();
    } catch (e) {
      erreur(e);
    } finally {
      setSaving(false);
    }
  };

  const detacher = async (lot: LotOp) => {
    try {
      await api(`/lots/${lot.id}/detacher`, { method: 'PATCH' });
      refresh();
    } catch (e) {
      erreur(e);
    }
  };

  const nomLot = (id: string | null) => actifs.concat(data).find((l) => l.id === id)?.reference ?? '—';

  return (
    <div className="space-y-6">
      {/* Barre de sélection / fusion */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h3 className="text-ui font-semibold">Opérations sur les lots</h3>
          <p className="text-2xs text-muted-foreground">
            Annexer, changer la destination, fusionner ou subdiviser. Les lots fusionnés/subdivisés
            sont conservés pour l'historique.
          </p>
        </div>
        <Button
          size="sm"
          disabled={selection.size < 2}
          onClick={() => setOp({ kind: 'fusion' })}
        >
          <Combine className="h-4 w-4" /> Fusionner la sélection ({selection.size})
        </Button>
      </Card>

      {actifs.length === 0 ? (
        <Card className="p-5 text-ui text-muted-foreground">Aucun lot actif.</Card>
      ) : (
        <Table>
          <THead>
            <Th className="w-0" />
            <Th>Lot</Th>
            <Th>Type</Th>
            <Th numeric>Superficie</Th>
            <Th>Rattachement</Th>
            <Th>Statut</Th>
            <Th className="w-0" />
          </THead>
          <tbody>
            {actifs.map((l) => (
              <Tr key={l.id}>
                <Td>
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner ${l.reference}`}
                    checked={selection.has(l.id)}
                    onChange={() => toggle(l.id)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                </Td>
                <Td className="font-medium">{l.reference}</Td>
                <Td className="text-muted-foreground">{LABELS[l.type] ?? l.type}</Td>
                <Td numeric className="text-muted-foreground">{l.superficie ? `${m2(l.superficie)} m²` : '—'}</Td>
                <Td className="text-muted-foreground">
                  {l.lotPrincipalId ? (
                    <span className="inline-flex items-center gap-1">
                      <Link2 className="h-3.5 w-3.5" /> annexe de {nomLot(l.lotPrincipalId)}
                    </span>
                  ) : (
                    '—'
                  )}
                </Td>
                <Td>
                  <Badge tone={LOT_STATUT_TONE[l.statut] ?? 'neutral'} dot>
                    {LABELS[l.statut] ?? l.statut}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <IconAction label="Changer la destination" onClick={() => setOp({ kind: 'destination', lot: l })}>
                      <Replace className="h-4 w-4" />
                    </IconAction>
                    <IconAction label="Subdiviser" onClick={() => setOp({ kind: 'subdivision', lot: l })}>
                      <Split className="h-4 w-4" />
                    </IconAction>
                    {l.lotPrincipalId ? (
                      <IconAction label="Détacher l'annexe" onClick={() => detacher(l)}>
                        <Unlink className="h-4 w-4" />
                      </IconAction>
                    ) : (
                      <IconAction label="Annexer à un lot principal" onClick={() => setOp({ kind: 'annexer', lot: l })}>
                        <Link2 className="h-4 w-4" />
                      </IconAction>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Historique : lots terminaux */}
      {historiques.length > 0 && (
        <Card className="p-5">
          <h3 className="flex items-center gap-2 text-ui font-semibold">
            <History className="h-4 w-4 text-muted-foreground" /> Historique (lots clôturés)
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {historiques.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-ui">
                <span className="font-medium line-through decoration-muted-foreground/50">{l.reference}</span>
                <Badge tone="neutral" dot>{LABELS[l.statut] ?? l.statut}</Badge>
                {l.origineLotId && <span className="text-2xs text-muted-foreground">issu de {nomLot(l.origineLotId)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Formulaires (panneaux latéraux) */}
      {op?.kind === 'fusion' && (
        <FusionSheet
          lots={selectionLots}
          batOptions={batOptions}
          saving={saving}
          onCancel={() => setOp(null)}
          onConfirm={async (nouveau) => {
            setSaving(true);
            try {
              await api(`/coproprietes/${coproprieteId}/lots/fusion`, {
                method: 'POST',
                body: JSON.stringify({ sourceLotIds: selectionLots.map((l) => l.id), nouveau }),
              });
              setOp(null);
              refresh();
            } catch (e) {
              erreur(e);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {op?.kind === 'subdivision' && (
        <SubdivisionSheet
          lot={op.lot}
          batOptions={batOptions}
          saving={saving}
          onCancel={() => setOp(null)}
          onConfirm={async (nouveaux) => {
            setSaving(true);
            try {
              await api(`/lots/${op.lot.id}/subdivision`, {
                method: 'POST',
                body: JSON.stringify({ nouveaux }),
              });
              setOp(null);
              refresh();
            } catch (e) {
              erreur(e);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {op?.kind === 'annexer' && (
        <AnnexerSheet
          lot={op.lot}
          candidats={actifs.filter((l) => l.id !== op.lot.id && !l.lotPrincipalId && !TERMINAUX.includes(l.statut))}
          saving={saving}
          onCancel={() => setOp(null)}
          onConfirm={(principalId) => annexer(op.lot, principalId)}
        />
      )}

      {op?.kind === 'destination' && (
        <DestinationSheet
          lot={op.lot}
          saving={saving}
          onCancel={() => setOp(null)}
          onConfirm={(type) => changerDestination(op.lot, type)}
        />
      )}
    </div>
  );
}

// --- Panneaux ---------------------------------------------------------------

function FusionSheet({
  lots,
  batOptions,
  saving,
  onCancel,
  onConfirm,
}: {
  lots: LotOp[];
  batOptions: (readonly [string, string])[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (nouveau: Record<string, unknown>) => void;
}) {
  const sommeM2 = lots.reduce((s, l) => s + m2(l.superficie), 0);
  const [n, setN] = useState<NouveauLot>({ ...nouveauVide(lots[0]?.type), superficie: sommeM2 ? String(sommeM2) : '' });

  return (
    <Sheet
      open
      onClose={onCancel}
      title="Fusionner les lots"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button
            disabled={saving || !n.reference.trim()}
            onClick={() => onConfirm(nettoyer(n))}
          >
            {saving && <Spinner />} Fusionner
          </Button>
        </>
      }
    >
      <p className="text-ui text-muted-foreground">
        {lots.length} lots fusionnés : {lots.map((l) => l.reference).join(', ')}. Ils passeront au
        statut « Fusionné » (conservés pour l'historique) et le nouveau lot ci-dessous sera créé.
      </p>
      <div className="mt-5">
        <LotFields valeur={n} onChange={setN} batOptions={batOptions} />
        <p className="mt-2 text-2xs text-muted-foreground">
          Superficie pré-remplie avec la somme des lots ({sommeM2} m²) — ajustable. Les tantièmes du
          nouveau lot seront à définir dans l'onglet Répartition.
        </p>
      </div>
    </Sheet>
  );
}

function SubdivisionSheet({
  lot,
  batOptions,
  saving,
  onCancel,
  onConfirm,
}: {
  lot: LotOp;
  batOptions: (readonly [string, string])[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (nouveaux: Record<string, unknown>[]) => void;
}) {
  const [rows, setRows] = useState<NouveauLot[]>([
    { ...nouveauVide(lot.type), batimentId: lot.batimentId ?? '' },
    { ...nouveauVide(lot.type), batimentId: lot.batimentId ?? '' },
  ]);
  const set = (i: number, v: NouveauLot) => setRows((r) => r.map((x, idx) => (idx === i ? v : x)));
  const valide = rows.length >= 2 && rows.every((r) => r.reference.trim());

  return (
    <Sheet
      open
      onClose={onCancel}
      title={`Subdiviser le lot ${lot.reference}`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button disabled={saving || !valide} onClick={() => onConfirm(rows.map(nettoyer))}>
            {saving && <Spinner />} Subdiviser en {rows.length}
          </Button>
        </>
      }
    >
      <p className="text-ui text-muted-foreground">
        Le lot <strong className="text-foreground">{lot.reference}</strong> passera au statut
        « Subdivisé » (conservé pour l'historique). Chaque nouveau lot gardera sa lignée.
      </p>
      <div className="mt-5 space-y-4">
        {rows.map((r, i) => (
          <div key={i} className="rounded-md border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xs font-semibold text-muted-foreground">Nouveau lot {i + 1}</span>
              {rows.length > 2 && (
                <button type="button" aria-label="Retirer" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <LotFields valeur={r} onChange={(v) => set(i, v)} batOptions={batOptions} />
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setRows((r) => [...r, { ...nouveauVide(lot.type), batimentId: lot.batimentId ?? '' }])}>
          <Plus className="h-4 w-4" /> Ajouter un lot
        </Button>
      </div>
    </Sheet>
  );
}

function AnnexerSheet({
  lot,
  candidats,
  saving,
  onCancel,
  onConfirm,
}: {
  lot: LotOp;
  candidats: LotOp[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (principalId: string) => void;
}) {
  const [principal, setPrincipal] = useState('');
  return (
    <Sheet
      open
      onClose={onCancel}
      title={`Annexer le lot ${lot.reference}`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button disabled={saving || !principal} onClick={() => onConfirm(principal)}>
            {saving && <Spinner />} Rattacher
          </Button>
        </>
      }
    >
      <p className="text-ui text-muted-foreground">
        Rattacher <strong className="text-foreground">{lot.reference}</strong> (ex. cave, parking) à
        un lot principal.
      </p>
      <div className="mt-5">
        <Field label="Lot principal" required>
          <SearchSelect
            value={principal}
            onChange={setPrincipal}
            options={candidats.map((l) => [l.id, `${l.reference} — ${LABELS[l.type] ?? l.type}`] as const)}
            allowEmpty
            emptyLabel="Choisir…"
          />
        </Field>
        {candidats.length === 0 && (
          <p className="mt-2 text-2xs text-muted-foreground">Aucun lot principal disponible.</p>
        )}
      </div>
    </Sheet>
  );
}

function DestinationSheet({
  lot,
  saving,
  onCancel,
  onConfirm,
}: {
  lot: LotOp;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (type: string) => void;
}) {
  const [type, setType] = useState(lot.type);
  return (
    <Sheet
      open
      onClose={onCancel}
      title={`Changer la destination de ${lot.reference}`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button disabled={saving || type === lot.type} onClick={() => onConfirm(type)}>
            {saving && <Spinner />} Appliquer
          </Button>
        </>
      }
    >
      <p className="text-ui text-muted-foreground">
        Destination actuelle : <strong className="text-foreground">{LABELS[lot.type] ?? lot.type}</strong>.
      </p>
      <div className="mt-5">
        <Field label="Nouvelle destination">
          <SearchSelect value={type} onChange={setType} options={LOT_TYPES} />
        </Field>
      </div>
    </Sheet>
  );
}

// --- Fragments partagés -----------------------------------------------------

function LotFields({
  valeur,
  onChange,
  batOptions,
}: {
  valeur: NouveauLot;
  onChange: (v: NouveauLot) => void;
  batOptions: (readonly [string, string])[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Référence" required>
        <Input value={valeur.reference} onChange={(e) => onChange({ ...valeur, reference: e.target.value })} placeholder="A101" />
      </Field>
      <Field label="Type">
        <SearchSelect value={valeur.type} onChange={(v) => onChange({ ...valeur, type: v })} options={LOT_TYPES} />
      </Field>
      <Field label="Superficie (m²)">
        <Input type="number" min={0} value={valeur.superficie} onChange={(e) => onChange({ ...valeur, superficie: e.target.value })} />
      </Field>
      <Field label="Bâtiment">
        <SearchSelect
          value={valeur.batimentId}
          onChange={(v) => onChange({ ...valeur, batimentId: v })}
          options={batOptions}
          allowEmpty
          emptyLabel="Non affecté"
        />
      </Field>
    </div>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground')}
    >
      {children}
    </button>
  );
}

// Transforme le formulaire en payload API (nettoie les champs vides).
function nettoyer(n: NouveauLot): Record<string, unknown> {
  return {
    reference: n.reference.trim(),
    type: n.type,
    superficie: n.superficie ? Number(n.superficie) : undefined,
    batimentId: n.batimentId || undefined,
  };
}
