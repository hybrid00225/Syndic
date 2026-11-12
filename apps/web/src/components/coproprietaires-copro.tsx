'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  Home,
  Pencil,
  Unlink,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Field } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { IconButton } from '@/components/ui/icon-button';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Spinner, PageLoader } from '@/components/ui/spinner';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { formatDate, cn } from '@/lib/utils';
import {
  LABELS,
  NATURE_DROIT,
  PERSONNE_TYPES,
  PERSONNE_STATUTS,
  PERSONNE_STATUT_TONE,
  MODE_NOTIFICATIONS,
  NATURE_REPRESENTATION,
} from '@/lib/constants';

interface Det {
  id: string;
  quotePartNum: number;
  quotePartDen: number;
  natureDroit: string;
  dateDebut: string;
  dateFin: string | null;
  lot: { id: string; reference: string; type: string };
}
interface PersonneRef {
  id: string;
  nom: string;
  prenom: string | null;
  type: string;
}
interface Owner extends PersonneRef {
  statut: string;
  modeNotification: string;
  natureRepresentation: string | null;
  representant: PersonneRef | null;
  contacts: { type: string; valeur: string }[];
  detentions: Det[];
}
interface LotRef {
  id: string;
  reference: string;
  type: string;
  statut: string;
}

const nom = (p: { nom: string; prenom: string | null; type: string }) =>
  p.type === 'MORALE' ? p.nom : `${p.prenom ?? ''} ${p.nom}`.trim();
const frac = (n: number, d: number) => (d ? n / d : 0);
const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function CoproprietairesCopro({ coproprieteId }: { coproprieteId: string }) {
  const owners = useApi<Owner[]>(`/coproprietes/${coproprieteId}/coproprietaires`);
  const lots = useApi<LotRef[]>(`/coproprietes/${coproprieteId}/lots`);
  const personnes = useApi<PersonneRef[]>('/personnes');
  const invalidate = useInvalidate();
  const confirm = useConfirm();
  const alert = useAlert();

  const [attribuer, setAttribuer] = useState(false);
  const [editOwner, setEditOwner] = useState<Owner | null>(null);

  const refresh = () => {
    invalidate(`/coproprietes/${coproprieteId}/coproprietaires`, '/personnes');
  };

  // Couverture : quote-part totale détenue par lot (doit atteindre 1).
  const couverture = useMemo(() => {
    const map = new Map<string, { ref: string; type: string; total: number }>();
    for (const l of lots.data ?? []) map.set(l.id, { ref: l.reference, type: l.type, total: 0 });
    for (const o of owners.data ?? []) {
      for (const d of o.detentions) {
        const e = map.get(d.lot.id);
        if (e) e.total += frac(d.quotePartNum, d.quotePartDen);
      }
    }
    return [...map.values()];
  }, [lots.data, owners.data]);

  if (owners.isLoading || lots.isLoading) {
    return <PageLoader label="Chargement des copropriétaires…" />;
  }
  if (owners.error || !owners.data) {
    return <ErrorState error={owners.error} onRetry={() => owners.refetch()} />;
  }

  const data = owners.data;
  const lotsCouverts = couverture.filter((c) => c.total > 0).length;
  const incomplets = couverture.filter((c) => c.total > 0 && Math.abs(c.total - 1) > 0.0001);
  const sansProprio = couverture.filter((c) => c.total === 0);

  const detacher = async (d: Det) => {
    const ok = await confirm({
      title: `Détacher le lot ${d.lot.reference} ?`,
      description: 'La détention sera clôturée. L’historique est conservé côté copropriétaire.',
      confirmLabel: 'Détacher',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/detentions/${d.id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      alert('Action impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  if (data.length === 0) {
    return (
      <>
        <EmptyState
          title="Aucun copropriétaire rattaché"
          steps={[
            'Un copropriétaire est une personne (physique ou morale) détenant un lot',
            'Attribuez un lot à une personne avec sa quote-part et la nature du droit',
            'Un lot peut avoir plusieurs copropriétaires (indivision)',
          ]}
          actions={
            <Button onClick={() => setAttribuer(true)}>
              <UserPlus className="h-4 w-4" /> Attribuer un lot
            </Button>
          }
        >
          La relation de propriété est plusieurs-à-plusieurs : une personne peut détenir plusieurs
          lots, et un lot peut être détenu par plusieurs personnes avec des quotes-parts.
        </EmptyState>
        {attribuer && (
          <AttribuerSheet
            coproprieteId={coproprieteId}
            lots={lots.data ?? []}
            personnes={personnes.data ?? []}
            onClose={() => setAttribuer(false)}
            onDone={() => {
              setAttribuer(false);
              refresh();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Synthèse */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-6 text-ui">
          <Tally label="Copropriétaires" value={data.length} />
          <Tally label="Lots avec propriétaire" value={`${lotsCouverts}/${couverture.length}`} />
          {incomplets.length > 0 && (
            <Tally label="Quote-part incomplète" value={incomplets.length} warn />
          )}
        </div>
        <Button size="sm" onClick={() => setAttribuer(true)}>
          <UserPlus className="h-4 w-4" /> Attribuer un lot
        </Button>
      </div>

      {(sansProprio.length > 0 || incomplets.length > 0) && (
        <Card className="flex items-start gap-2 border-warning/40 bg-warning/5 p-3.5 text-ui">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            {sansProprio.length > 0 && (
              <p>
                <strong>{sansProprio.length} lot(s)</strong> sans copropriétaire :{' '}
                {sansProprio.map((c) => c.ref).join(', ')}.
              </p>
            )}
            {incomplets.length > 0 && (
              <p>
                <strong>{incomplets.length} lot(s)</strong> dont la quote-part totale ≠ 100 % :{' '}
                {incomplets.map((c) => `${c.ref} (${Math.round(c.total * 100)} %)`).join(', ')}.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Copropriétaires */}
      <div className="grid gap-3 lg:grid-cols-2">
        {data.map((o) => (
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background text-2xs font-semibold',
                    o.type === 'MORALE' ? 'rounded-md' : 'rounded-full',
                  )}
                >
                  {nom(o).slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <Link href={`/coproprietaires/${o.id}`} className="flex items-center gap-1 font-medium hover:underline">
                    {nom(o)} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-muted-foreground">
                    <span>{LABELS[o.type] ?? o.type}</span>
                    <Badge tone={PERSONNE_STATUT_TONE[o.statut] ?? 'neutral'} dot>
                      {LABELS[o.statut] ?? o.statut}
                    </Badge>
                    <span>· notif. {LABELS[o.modeNotification] ?? o.modeNotification}</span>
                  </div>
                </div>
              </div>
              <IconButton label="Modifier le copropriétaire" icon={Pencil} onClick={() => setEditOwner(o)} />
            </div>

            {o.representant && (
              <p className="mt-2 flex items-center gap-1.5 text-2xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                {LABELS[o.natureRepresentation ?? ''] ?? 'Représentant'} : {nom(o.representant)}
              </p>
            )}

            {/* Contacts */}
            <div className="mt-2 flex flex-wrap gap-3 text-2xs text-muted-foreground">
              {o.contacts.filter((c) => c.type === 'EMAIL').slice(0, 1).map((c) => (
                <span key={c.valeur} className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {c.valeur}</span>
              ))}
              {o.contacts.filter((c) => c.type === 'TELEPHONE').slice(0, 1).map((c) => (
                <span key={c.valeur} className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.valeur}</span>
              ))}
            </div>

            {/* Lots détenus */}
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {o.detentions.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-ui">
                  <span className="flex items-center gap-2">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{d.lot.reference}</span>
                    <span className="text-muted-foreground">{LABELS[d.natureDroit] ?? d.natureDroit}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="nums rounded bg-muted px-1.5 text-2xs">{d.quotePartNum}/{d.quotePartDen}</span>
                    <IconButton label="Détacher ce lot" icon={Unlink} size="xs" tone="danger" onClick={() => detacher(d)} />
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Couverture des lots */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-ui font-semibold">Couverture des lots</h3>
          <p className="text-2xs text-muted-foreground">Somme des quotes-parts détenues par lot.</p>
        </div>
        <Table>
          <THead>
            <Th>Lot</Th>
            <Th>Type</Th>
            <Th numeric>Quote-part totale</Th>
            <Th>État</Th>
          </THead>
          <tbody>
            {couverture.map((c) => {
              const pct = Math.round(c.total * 100);
              const complet = Math.abs(c.total - 1) <= 0.0001;
              return (
                <Tr key={c.ref}>
                  <Td className="font-medium">{c.ref}</Td>
                  <Td className="text-muted-foreground">{LABELS[c.type] ?? c.type}</Td>
                  <Td numeric className="nums">{pct} %</Td>
                  <Td>
                    {c.total === 0 ? (
                      <Badge tone="danger" dot>Sans propriétaire</Badge>
                    ) : complet ? (
                      <Badge tone="success" dot>Complet</Badge>
                    ) : (
                      <Badge tone="warning" dot>Incomplet</Badge>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {attribuer && (
        <AttribuerSheet
          coproprieteId={coproprieteId}
          lots={lots.data ?? []}
          personnes={personnes.data ?? []}
          onClose={() => setAttribuer(false)}
          onDone={() => {
            setAttribuer(false);
            refresh();
          }}
        />
      )}
      {editOwner && (
        <EditOwnerSheet
          owner={editOwner}
          personnes={(personnes.data ?? []).filter((p) => p.id !== editOwner.id)}
          onClose={() => setEditOwner(null)}
          onDone={() => {
            setEditOwner(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

// --- Attribuer un lot -------------------------------------------------------

function AttribuerSheet({
  coproprieteId,
  lots,
  personnes,
  onClose,
  onDone,
}: {
  coproprieteId: string;
  lots: LotRef[];
  personnes: PersonneRef[];
  onClose: () => void;
  onDone: () => void;
}) {
  const alert = useAlert();
  const [lotId, setLotId] = useState('');
  const [mode, setMode] = useState<'existant' | 'nouveau'>('existant');
  const [personneId, setPersonneId] = useState('');
  const [nouveau, setNouveau] = useState({ type: 'PHYSIQUE', nom: '', prenom: '' });
  const [num, setNum] = useState('1');
  const [den, setDen] = useState('1');
  const [nature, setNature] = useState('PLEINE_PROPRIETE');
  const [dateDebut, setDateDebut] = useState(aujourdhui());
  const [saving, setSaving] = useState(false);

  const valide =
    lotId &&
    Number(num) > 0 &&
    Number(den) > 0 &&
    (mode === 'existant' ? personneId : nouveau.nom.trim());

  const enregistrer = async () => {
    setSaving(true);
    try {
      let pid = personneId;
      if (mode === 'nouveau') {
        const p = await api<{ id: string }>('/personnes', {
          method: 'POST',
          body: JSON.stringify({
            type: nouveau.type,
            nom: nouveau.nom.trim(),
            prenom: nouveau.prenom.trim() || undefined,
          }),
        });
        pid = p.id;
      }
      await api(`/lots/${lotId}/detentions`, {
        method: 'POST',
        body: JSON.stringify({
          personneId: pid,
          quotePartNum: Number(num),
          quotePartDen: Number(den),
          natureDroit: nature,
          dateDebut: new Date(dateDebut).toISOString(),
        }),
      });
      onDone();
    } catch (e) {
      alert('Attribution impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Attribuer un lot"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button disabled={saving || !valide} onClick={enregistrer}>
            {saving && <Spinner />} Attribuer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Lot" required>
          <SearchSelect
            value={lotId}
            onChange={setLotId}
            options={lots.map((l) => [l.id, `${l.reference} — ${LABELS[l.type] ?? l.type}`] as const)}
            allowEmpty
            emptyLabel="Choisir un lot…"
          />
        </Field>

        <div>
          <Segmented
            className="mb-3"
            aria-label="Copropriétaire"
            value={mode}
            onChange={setMode}
            options={[
              ['existant', 'Copropriétaire existant'],
              ['nouveau', 'Nouveau'],
            ]}
          />
          {mode === 'existant' ? (
            <Field label="Copropriétaire" required>
              <SearchSelect
                value={personneId}
                onChange={setPersonneId}
                options={personnes.map((p) => [p.id, nom(p)] as const)}
                allowEmpty
                emptyLabel="Choisir une personne…"
              />
            </Field>
          ) : (
            <div className="space-y-3">
              <Field label="Type de personne">
                <SearchSelect value={nouveau.type} onChange={(v) => setNouveau({ ...nouveau, type: v })} options={PERSONNE_TYPES} />
              </Field>
              {nouveau.type === 'MORALE' ? (
                <Field label="Raison sociale" required>
                  <Input
                    value={nouveau.nom}
                    onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
                    placeholder="Ex. SCI Les Palmiers"
                  />
                </Field>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nom" required>
                    <Input
                      value={nouveau.nom}
                      onChange={(e) => setNouveau({ ...nouveau, nom: e.target.value })}
                      placeholder="Ex. Koné"
                      autoComplete="family-name"
                    />
                  </Field>
                  <Field label="Prénom">
                    <Input
                      value={nouveau.prenom}
                      onChange={(e) => setNouveau({ ...nouveau, prenom: e.target.value })}
                      placeholder="Ex. Awa"
                      autoComplete="given-name"
                    />
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nature du droit">
            <SearchSelect value={nature} onChange={setNature} options={NATURE_DROIT} />
          </Field>
          <Field label="Date de début" required>
            <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </Field>
          <Field label="Quote-part — numérateur" required hint="Ex. 1 (part) sur…">
            <Input type="number" min={1} value={num} onChange={(e) => setNum(e.target.value)} placeholder="Ex. 1" />
          </Field>
          <Field label="… dénominateur" required hint="Ex. 1 (seul) ou 2 (moitié), 3…">
            <Input type="number" min={1} value={den} onChange={(e) => setDen(e.target.value)} placeholder="Ex. 2 (moitié)" />
          </Field>
        </div>
        <p className="text-2xs text-muted-foreground">
          Un lot peut être détenu par plusieurs copropriétaires (indivision) : la somme des
          quotes-parts d'un lot doit atteindre 1 (100 %).
        </p>
      </div>
    </Sheet>
  );
}

// --- Éditer un copropriétaire (statut, notif, représentant) -----------------

function EditOwnerSheet({
  owner,
  personnes,
  onClose,
  onDone,
}: {
  owner: Owner;
  personnes: PersonneRef[];
  onClose: () => void;
  onDone: () => void;
}) {
  const alert = useAlert();
  const [statut, setStatut] = useState(owner.statut);
  const [notif, setNotif] = useState(owner.modeNotification);
  const [representantId, setRepresentantId] = useState(owner.representant?.id ?? '');
  const [nature, setNature] = useState(owner.natureRepresentation ?? 'MANDATAIRE');
  const [saving, setSaving] = useState(false);

  const enregistrer = async () => {
    setSaving(true);
    try {
      await api(`/personnes/${owner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          statut,
          modeNotification: notif,
          representantId: representantId || null,
          natureRepresentation: representantId ? nature : null,
        }),
      });
      onDone();
    } catch (e) {
      alert('Enregistrement impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={nom(owner)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button disabled={saving} onClick={enregistrer}>
            {saving && <Spinner />} Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Statut" hint="Un statut non actif ne retire jamais les droits de propriété.">
            <SearchSelect value={statut} onChange={setStatut} options={PERSONNE_STATUTS} />
          </Field>
          <Field label="Mode de notification">
            <SearchSelect value={notif} onChange={setNotif} options={MODE_NOTIFICATIONS} />
          </Field>
        </div>
        <div className="border-t border-border pt-4">
          <p className="mb-2 text-ui font-medium">Représentation</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Représentant" hint="Mandataire, tuteur ou représentant légal.">
              <SearchSelect
                value={representantId}
                onChange={setRepresentantId}
                options={personnes.map((p) => [p.id, nom(p)] as const)}
                allowEmpty
                emptyLabel="Aucun"
              />
            </Field>
            {representantId && (
              <Field label="Nature">
                <SearchSelect value={nature} onChange={setNature} options={NATURE_REPRESENTATION} />
              </Field>
            )}
          </div>
        </div>
        <p className="text-2xs text-muted-foreground">
          Les coordonnées (email, téléphone, adresses) et l'identité se modifient depuis la{' '}
          <Link href={`/coproprietaires/${owner.id}/modifier`} className="text-primary hover:underline">fiche du copropriétaire</Link>.
        </p>
      </div>
    </Sheet>
  );
}

// --- petits fragments -------------------------------------------------------

function Tally({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div>
      <div className={cn('font-display text-2xl font-semibold tabular-nums', warn ? 'text-warning' : 'text-foreground')}>{value}</div>
      <div className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

