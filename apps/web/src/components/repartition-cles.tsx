'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, KeyRound, Plus, Scale, Ruler, Equal } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Field } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Spinner, PageLoader } from '@/components/ui/spinner';
import { useAlert } from '@/components/ui/confirm';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { formatDate, cn } from '@/lib/utils';
import { LABELS } from '@/lib/constants';

interface CleSummary {
  id: string;
  coproprieteId: string;
  nom: string;
  description: string | null;
  versionCourante: {
    id: string;
    dateEffet: string;
    totalTantiemes: number;
    nbLots: number;
  } | null;
}
interface LotRef {
  id: string;
  reference: string;
  type: string;
  superficie: string | null;
  batiment: { nom: string } | null;
}
interface VersionDetail {
  id: string;
  dateEffet: string;
  dateFin: string | null;
  totalTantiemes: number;
  tantiemes: { lotId: string; valeur: number }[];
}
interface CleDetail {
  id: string;
  coproprieteId: string;
  nom: string;
  description: string | null;
  versions: VersionDetail[];
  lots: LotRef[];
}

const BASES = [
  ['libre', 'Base libre'],
  ['100', 'Base 100'],
  ['1000', 'Base 1 000'],
  ['10000', 'Base 10 000'],
] as const;

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** Répartit un total entier selon des poids, au plus proche (plus forts restes). */
function distribuer(total: number, poids: number[]): number[] {
  const sommePoids = poids.reduce((a, b) => a + b, 0);
  if (sommePoids <= 0) return poids.map(() => 0);
  const bruts = poids.map((p) => (p / sommePoids) * total);
  const bas = bruts.map((x) => Math.floor(x));
  let reste = total - bas.reduce((a, b) => a + b, 0);
  const ordre = bruts
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...bas];
  for (let k = 0; k < reste; k++) out[ordre[k % ordre.length].i]++;
  return out;
}

export function RepartitionCles({ coproprieteId }: { coproprieteId: string }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (editing) {
    return (
      <EditeurTantiemes
        cleId={editing}
        coproprieteId={coproprieteId}
        onClose={() => setEditing(null)}
      />
    );
  }

  return (
    <ListeCles
      coproprieteId={coproprieteId}
      creating={creating}
      setCreating={setCreating}
      onEdit={setEditing}
    />
  );
}

// --- Liste des clés ---------------------------------------------------------

function ListeCles({
  coproprieteId,
  creating,
  setCreating,
  onEdit,
}: {
  coproprieteId: string;
  creating: boolean;
  setCreating: (v: boolean) => void;
  onEdit: (id: string) => void;
}) {
  const { data, error, isLoading, refetch } = useApi<CleSummary[]>(
    `/coproprietes/${coproprieteId}/cles`,
  );
  const invalidate = useInvalidate();
  const alert = useAlert();
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const creer = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      await api(`/coproprietes/${coproprieteId}/cles`, {
        method: 'POST',
        body: JSON.stringify({ nom: nom.trim(), description: description.trim() || undefined }),
      });
      setNom('');
      setDescription('');
      setCreating(false);
      invalidate(`/coproprietes/${coproprieteId}/cles`);
    } catch (e) {
      alert('Création impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader label="Chargement des clés de répartition…" />;
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  const formNouvelle = (
    <Card className="p-5">
      <h3 className="text-ui font-semibold">Nouvelle clé de répartition</h3>
      <p className="mt-0.5 text-2xs text-muted-foreground">
        Une clé = un périmètre de charges (charges générales, ascenseur, eau…). Chaque clé a ses
        propres tantièmes par lot.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required hint="Ex. « Ascenseur bâtiment A », « Eau », « Espaces verts ».">
          <Input autoFocus value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Charges ascenseur" />
        </Field>
        <Field label="Description" hint="Précisez le périmètre (lots concernés), facultatif.">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Lots desservis par l'ascenseur" />
        </Field>
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={creer} disabled={saving || !nom.trim()}>
          {saving && <Spinner />} Créer la clé
        </Button>
        <Button variant="secondary" onClick={() => setCreating(false)}>
          Annuler
        </Button>
      </div>
    </Card>
  );

  if (data.length === 0 && !creating) {
    return (
      <EmptyState
        title="Aucune clé de répartition"
        steps={[
          'Créer une clé par périmètre de charges (générales, ascenseur…)',
          'Saisir les tantièmes de chaque lot',
          'La clé sert ensuite à répartir les appels de fonds',
        ]}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nouvelle clé
          </Button>
        }
      >
        Les charges se répartissent entre les lots selon des clés. Une copropriété peut en avoir
        plusieurs : une clé générale, une clé par équipement commun (ascenseur, eau…).
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-2xs text-muted-foreground">
          {data.length} clé{data.length > 1 ? 's' : ''} de répartition.
        </p>
        {!creating && (
          <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nouvelle clé
          </Button>
        )}
      </div>

      {creating && formNouvelle}

      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((c) => (
          <Card key={c.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground">
                <KeyRound className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-ui font-semibold">{c.nom}</h3>
                {c.description && (
                  <p className="truncate text-2xs text-muted-foreground">{c.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-2xs text-muted-foreground">
              {c.versionCourante ? (
                <>
                  <Badge tone="success" dot>
                    {c.versionCourante.totalTantiemes.toLocaleString('fr-FR')} tantièmes
                  </Badge>
                  <span>· {c.versionCourante.nbLots} lot{c.versionCourante.nbLots > 1 ? 's' : ''}</span>
                  <span>· depuis le {formatDate(c.versionCourante.dateEffet)}</span>
                </>
              ) : (
                <Badge tone="warning" dot>
                  Tantièmes à définir
                </Badge>
              )}
            </div>
            <Button variant="secondary" size="sm" className="self-start" onClick={() => onEdit(c.id)}>
              <Scale className="h-4 w-4" /> Configurer les tantièmes
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Éditeur de tantièmes ---------------------------------------------------

function EditeurTantiemes({
  cleId,
  coproprieteId,
  onClose,
}: {
  cleId: string;
  coproprieteId: string;
  onClose: () => void;
}) {
  const { data, error, isLoading, refetch } = useApi<CleDetail>(`/cles/${cleId}`);
  const invalidate = useInvalidate();
  const alert = useAlert();

  const courante = useMemo(
    () => data?.versions.find((v) => v.dateFin === null) ?? null,
    [data],
  );

  const [valeurs, setValeurs] = useState<Record<string, string>>({});
  const [base, setBase] = useState<string>('libre');
  const [dateEffet, setDateEffet] = useState(aujourdhui());
  const [saving, setSaving] = useState<null | 'corrige' | 'nouvelle'>(null);

  // Pré-remplissage depuis la version courante (ou 0 partout).
  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const lot of data.lots) map[lot.id] = '0';
    for (const t of courante?.tantiemes ?? []) map[t.lotId] = String(t.valeur);
    setValeurs(map);
    if (courante) setDateEffet(courante.dateEffet.slice(0, 10));
  }, [data, courante]);

  const setVal = (lotId: string, v: string) =>
    setValeurs((m) => ({ ...m, [lotId]: v.replace(/[^0-9]/g, '') }));

  const total = useMemo(
    () => Object.values(valeurs).reduce((a, v) => a + (Number(v) || 0), 0),
    [valeurs],
  );
  const cible = base === 'libre' ? null : Number(base);
  const ecart = cible !== null ? total - cible : 0;

  if (isLoading) return <PageLoader label="Chargement de la clé…" />;
  if (error || !data) return <ErrorState error={error} onRetry={() => refetch()} />;

  // Répartit la base (ou la somme des superficies) selon un poids par lot.
  const repartir = (par: 'superficie' | 'egal') => {
    const lots = data.lots;
    const poids =
      par === 'superficie'
        ? lots.map((l) => Math.round(Number(l.superficie ?? 0)))
        : lots.map(() => 1);
    const totalCible =
      cible ??
      (par === 'superficie'
        ? poids.reduce((a, b) => a + b, 0) || lots.length
        : lots.length);
    const repartis = distribuer(totalCible, poids.some((p) => p > 0) ? poids : lots.map(() => 1));
    const map: Record<string, string> = {};
    lots.forEach((l, i) => (map[l.id] = String(repartis[i])));
    setValeurs(map);
  };

  const payload = () => ({
    dateEffet: new Date(dateEffet).toISOString(),
    tantiemes: data.lots
      .map((l) => ({ lotId: l.id, valeur: Number(valeurs[l.id]) || 0 }))
      // On n'envoie pas les lots à 0 : ils ne portent pas cette charge.
      .filter((t) => t.valeur > 0),
  });

  const enregistrer = async (mode: 'corrige' | 'nouvelle') => {
    const body = payload();
    if (body.tantiemes.length === 0) {
      alert('Rien à enregistrer', 'Attribuez au moins un tantième à un lot.');
      return;
    }
    setSaving(mode);
    try {
      const url =
        mode === 'corrige'
          ? `/cles/${cleId}/versions/courante`
          : `/cles/${cleId}/versions`;
      await api(url, {
        method: mode === 'corrige' ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      invalidate(`/coproprietes/${coproprieteId}/cles`, `/cles/${cleId}`);
      onClose();
    } catch (e) {
      alert('Enregistrement impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête : retour à la liste, puis la clé */}
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" /> Toutes les clés
        </Button>
        <h2 className="mt-1 font-display text-xl font-medium leading-tight">{data.nom}</h2>
        {data.description && <p className="mt-1 text-ui text-muted-foreground">{data.description}</p>}
      </div>

      {/* Paramètres de la répartition | aides de calcul */}
      <Card className="grid md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Base de tantièmes" hint="Convention d’affichage (ex. 1 000 ou 10 000).">
            <SearchSelect value={base} onChange={setBase} options={BASES as any} />
          </Field>
          <Field label="Date d'effet" hint="La répartition s’applique à partir de cette date.">
            <Input type="date" value={dateEffet} onChange={(e) => setDateEffet(e.target.value)} />
          </Field>
        </div>
        <div className="border-t border-border p-4 md:border-l md:border-t-0">
          <p className="mb-1.5 text-ui font-medium">Aides au calcul</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => repartir('superficie')}>
              <Ruler className="h-4 w-4" /> Par superficie
            </Button>
            <Button variant="secondary" onClick={() => repartir('egal')}>
              <Equal className="h-4 w-4" /> Parts égales
            </Button>
          </div>
          <p className="mt-1.5 text-2xs text-muted-foreground">Pré-remplit les tantièmes, ajustables ensuite.</p>
        </div>
      </Card>

      {/* Grille lot → tantièmes */}
      <Table
        footer={
          <div className="flex items-center justify-between text-ui">
            <span className="text-muted-foreground">Total des tantièmes</span>
            <span className="flex items-center gap-2">
              <strong className="nums text-base font-semibold">{total.toLocaleString('fr-FR')}</strong>
              {cible !== null && (
                <span className={cn('text-2xs', ecart === 0 ? 'text-success' : 'text-warning')}>
                  {ecart === 0 ? `= base ${cible.toLocaleString('fr-FR')}` : `${ecart > 0 ? '+' : ''}${ecart} vs base`}
                </span>
              )}
            </span>
          </div>
        }
      >
        <THead>
          <Th>Lot</Th>
          <Th>Type</Th>
          <Th>Bâtiment</Th>
          <Th numeric>Superficie</Th>
          <Th numeric>Tantièmes</Th>
          <Th numeric>Quote-part</Th>
        </THead>
        <tbody>
          {data.lots.map((l) => {
            const v = Number(valeurs[l.id]) || 0;
            const pct = total > 0 ? (v / total) * 100 : 0;
            return (
              <Tr key={l.id}>
                <Td className="font-medium">{l.reference}</Td>
                <Td className="text-muted-foreground">{LABELS[l.type] ?? l.type}</Td>
                <Td className="text-muted-foreground">{l.batiment?.nom ?? '—'}</Td>
                <Td numeric className="text-muted-foreground">
                  {l.superficie ? `${Number(l.superficie).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} m²` : '—'}
                </Td>
                <Td numeric>
                  <Input
                    inputMode="numeric"
                    value={valeurs[l.id] ?? '0'}
                    onChange={(e) => setVal(l.id, e.target.value)}
                    placeholder="0"
                    aria-label={`Tantièmes du lot ${l.reference}`}
                    className="ml-auto h-9 w-24 text-right"
                  />
                </Td>
                <Td numeric className="text-muted-foreground">
                  {pct ? `${pct.toFixed(1)} %` : '—'}
                </Td>
              </Tr>
            );
          })}
          {data.lots.length === 0 && (
            <Tr>
              <Td className="text-muted-foreground" colSpan={6}>
                Cette copropriété n'a pas encore de lot. Ajoutez des lots avant de répartir.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>

      {/* Enregistrement */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => enregistrer('corrige')} disabled={!!saving || !courante}>
          {saving === 'corrige' && <Spinner />} Enregistrer
        </Button>
        <Button variant="secondary" onClick={() => enregistrer('nouvelle')} disabled={!!saving}>
          {saving === 'nouvelle' && <Spinner />} Créer une nouvelle version datée
        </Button>
        <p className="text-2xs text-muted-foreground">
          {courante
            ? '« Enregistrer » corrige la répartition courante. Dès qu’elle a servi à un appel de fonds, créez une nouvelle version datée pour en conserver l’historique.'
            : 'Première répartition : elle sera enregistrée à la date d’effet choisie.'}
        </p>
      </div>
    </div>
  );
}
