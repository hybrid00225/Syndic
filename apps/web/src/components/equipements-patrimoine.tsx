'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Wrench,
  LayoutGrid,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useApi, useInvalidate } from '@/lib/query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea, Field } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Spinner, PageLoader } from '@/components/ui/spinner';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { formatDate, cn } from '@/lib/utils';
import {
  LABELS,
  EQUIPEMENT_CATEGORIES,
  EQUIPEMENT_ETATS,
  EQUIPEMENT_ETAT_TONE,
  PARTIE_COMMUNE_TYPES,
} from '@/lib/constants';

interface Ref {
  id: string;
  nom: string;
}
interface PartieCommune {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  batiment: Ref | null;
  _count?: { equipements: number };
}
interface Equipement {
  id: string;
  nom: string;
  categorie: string;
  reference: string;
  numeroSerie: string | null;
  dateInstallation: string | null;
  garantieFin: string | null;
  fournisseur: string | null;
  etat: string;
  notes: string | null;
  batiment: Ref | null;
  partieCommune: Ref | null;
}

export function EquipementsPatrimoine({ coproprieteId }: { coproprieteId: string }) {
  const equipements = useApi<Equipement[]>(`/coproprietes/${coproprieteId}/equipements`);
  const parties = useApi<PartieCommune[]>(`/coproprietes/${coproprieteId}/parties-communes`);
  const batiments = useApi<Ref[]>(`/coproprietes/${coproprieteId}/batiments`);

  if (equipements.isLoading || parties.isLoading) {
    return <PageLoader label="Chargement de l'inventaire technique…" />;
  }
  if (equipements.error || !equipements.data) {
    return <ErrorState error={equipements.error} onRetry={() => equipements.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PartiesCommunes
        coproprieteId={coproprieteId}
        parties={parties.data ?? []}
        batiments={batiments.data ?? []}
      />
      <Equipements
        coproprieteId={coproprieteId}
        equipements={equipements.data}
        parties={parties.data ?? []}
        batiments={batiments.data ?? []}
      />
    </div>
  );
}

// --- Parties communes -------------------------------------------------------

function PartiesCommunes({
  coproprieteId,
  parties,
  batiments,
}: {
  coproprieteId: string;
  parties: PartieCommune[];
  batiments: Ref[];
}) {
  const invalidate = useInvalidate();
  const confirm = useConfirm();
  const alert = useAlert();
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState('GENERALE');
  const [batimentId, setBatimentId] = useState('');
  const [saving, setSaving] = useState(false);

  const ajouter = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      await api(`/coproprietes/${coproprieteId}/parties-communes`, {
        method: 'POST',
        body: JSON.stringify({
          nom: nom.trim(),
          type,
          batimentId: batimentId || undefined,
        }),
      });
      setNom('');
      setType('GENERALE');
      setBatimentId('');
      setOpen(false);
      invalidate(`/coproprietes/${coproprieteId}/parties-communes`);
    } catch (e) {
      alert('Création impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (pc: PartieCommune) => {
    const ok = await confirm({
      title: `Supprimer « ${pc.nom} » ?`,
      description: 'Cette partie commune sera définitivement supprimée.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/parties-communes/${pc.id}`, { method: 'DELETE' });
      invalidate(`/coproprietes/${coproprieteId}/parties-communes`);
    } catch (e) {
      alert('Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-ui font-semibold">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" /> Parties communes
          </h3>
          <p className="text-2xs text-muted-foreground">
            Générales (toute la copropriété) ou spéciales (certains bâtiments/lots).
          </p>
        </div>
        {!open && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-4 grid gap-3 rounded-md border border-border bg-muted/30 p-3.5 sm:grid-cols-4">
          <Field className="sm:col-span-2" label="Nom" required>
            <Input autoFocus value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Hall, toiture, cour…" />
          </Field>
          <Field label="Type">
            <SearchSelect value={type} onChange={setType} options={PARTIE_COMMUNE_TYPES} />
          </Field>
          <Field label="Bâtiment">
            <SearchSelect
              value={batimentId}
              onChange={setBatimentId}
              options={batiments.map((b) => [b.id, b.nom] as const)}
              allowEmpty
              emptyLabel="Toute la copropriété"
            />
          </Field>
          <div className="flex gap-2 sm:col-span-4">
            <Button size="sm" onClick={ajouter} disabled={saving || !nom.trim()}>
              {saving && <Spinner />} Ajouter
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {parties.length === 0 ? (
        <p className="mt-4 text-ui text-muted-foreground">
          Aucune partie commune déclarée. Elles servent à localiser les équipements et cadrer les
          charges spéciales.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {parties.map((pc) => (
            <li
              key={pc.id}
              className="group flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-ui"
            >
              <span className="font-medium">{pc.nom}</span>
              <Badge tone={pc.type === 'SPECIALE' ? 'warning' : 'neutral'} dot>
                {LABELS[pc.type] ?? pc.type}
              </Badge>
              {pc.batiment && <span className="text-2xs text-muted-foreground">· {pc.batiment.nom}</span>}
              {!!pc._count?.equipements && (
                <span className="text-2xs text-muted-foreground">
                  · {pc._count.equipements} équip.
                </span>
              )}
              <button
                type="button"
                aria-label={`Supprimer ${pc.nom}`}
                onClick={() => supprimer(pc)}
                className="ml-1 text-muted-foreground opacity-0 transition hover:text-danger group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// --- Équipements ------------------------------------------------------------

const vide = {
  nom: '',
  categorie: 'ASCENSEUR',
  reference: '',
  numeroSerie: '',
  dateInstallation: '',
  garantieFin: '',
  fournisseur: '',
  etat: 'EN_SERVICE',
  notes: '',
  batimentId: '',
  partieCommuneId: '',
};

function Equipements({
  coproprieteId,
  equipements,
  parties,
  batiments,
}: {
  coproprieteId: string;
  equipements: Equipement[];
  parties: PartieCommune[];
  batiments: Ref[];
}) {
  const invalidate = useInvalidate();
  const confirm = useConfirm();
  const alert = useAlert();
  const [form, setForm] = useState<(typeof vide & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const e of equipements) acc[e.etat] = (acc[e.etat] ?? 0) + 1;
    return acc;
  }, [equipements]);

  const refresh = () => invalidate(`/coproprietes/${coproprieteId}/equipements`);

  const ouvrirEdition = (e: Equipement) =>
    setForm({
      id: e.id,
      nom: e.nom,
      categorie: e.categorie,
      reference: e.reference,
      numeroSerie: e.numeroSerie ?? '',
      dateInstallation: e.dateInstallation?.slice(0, 10) ?? '',
      garantieFin: e.garantieFin?.slice(0, 10) ?? '',
      fournisseur: e.fournisseur ?? '',
      etat: e.etat,
      notes: e.notes ?? '',
      batimentId: e.batiment?.id ?? '',
      partieCommuneId: e.partieCommune?.id ?? '',
    });

  const enregistrer = async () => {
    if (!form || !form.nom.trim() || !form.reference.trim()) return;
    setSaving(true);
    const body = {
      nom: form.nom.trim(),
      categorie: form.categorie,
      reference: form.reference.trim(),
      numeroSerie: form.numeroSerie || undefined,
      dateInstallation: form.dateInstallation || undefined,
      garantieFin: form.garantieFin || undefined,
      fournisseur: form.fournisseur || undefined,
      etat: form.etat,
      notes: form.notes || undefined,
      batimentId: form.batimentId || undefined,
      partieCommuneId: form.partieCommuneId || undefined,
    };
    try {
      if (form.id) {
        await api(`/equipements/${form.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api(`/coproprietes/${coproprieteId}/equipements`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      setForm(null);
      refresh();
    } catch (e) {
      alert('Enregistrement impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  const changerEtat = async (e: Equipement, etat: string) => {
    try {
      await api(`/equipements/${e.id}/etat`, { method: 'PATCH', body: JSON.stringify({ etat }) });
      refresh();
    } catch (err) {
      alert('Changement impossible', err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  };

  const supprimer = async (e: Equipement) => {
    const ok = await confirm({
      title: `Supprimer « ${e.nom} » ?`,
      description: "L'équipement sera retiré de l'inventaire technique.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/equipements/${e.id}`, { method: 'DELETE' });
      refresh();
    } catch (err) {
      alert('Suppression impossible', err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-ui font-semibold">
            <Wrench className="h-4 w-4 text-muted-foreground" /> Équipements
          </h3>
          <p className="text-2xs text-muted-foreground">
            Inventaire technique : ascenseurs, pompes, caméras, piscine… avec leur état et garantie.
          </p>
        </div>
        {!form && (
          <Button size="sm" onClick={() => setForm({ ...vide })}>
            <Plus className="h-4 w-4" /> Nouvel équipement
          </Button>
        )}
      </div>

      {/* Synthèse par état */}
      {equipements.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4 border-y border-border py-3">
          {EQUIPEMENT_ETATS.map(([k, label]) => (
            <div key={k} className="flex items-center gap-2 text-ui">
              <Badge tone={EQUIPEMENT_ETAT_TONE[k]} dot>
                {stats[k] ?? 0}
              </Badge>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire création/édition */}
      {form && (
        <div className="mt-4 rounded-md border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-ui font-semibold">
              {form.id ? "Modifier l'équipement" : 'Nouvel équipement'}
            </h4>
            <button type="button" aria-label="Fermer" onClick={() => setForm(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nom" required>
              <Input autoFocus value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ascenseur A" />
            </Field>
            <Field label="Catégorie" required>
              <SearchSelect value={form.categorie} onChange={(v) => setForm({ ...form, categorie: v })} options={EQUIPEMENT_CATEGORIES} />
            </Field>
            <Field label="Référence" required hint="Unique dans la copropriété.">
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="ASC-001" />
            </Field>
            <Field label="État">
              <SearchSelect value={form.etat} onChange={(v) => setForm({ ...form, etat: v })} options={EQUIPEMENT_ETATS} />
            </Field>
            <Field label="N° de série">
              <Input value={form.numeroSerie} onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })} />
            </Field>
            <Field label="Fournisseur" hint="Texte libre pour l'instant.">
              <Input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} placeholder="Otis, Schindler…" />
            </Field>
            <Field label="Date d'installation">
              <Input type="date" value={form.dateInstallation} onChange={(e) => setForm({ ...form, dateInstallation: e.target.value })} />
            </Field>
            <Field label="Fin de garantie">
              <Input type="date" value={form.garantieFin} onChange={(e) => setForm({ ...form, garantieFin: e.target.value })} />
            </Field>
            <Field label="Bâtiment">
              <SearchSelect
                value={form.batimentId}
                onChange={(v) => setForm({ ...form, batimentId: v })}
                options={batiments.map((b) => [b.id, b.nom] as const)}
                allowEmpty
                emptyLabel="Non affecté"
              />
            </Field>
            <Field label="Partie commune">
              <SearchSelect
                value={form.partieCommuneId}
                onChange={(v) => setForm({ ...form, partieCommuneId: v })}
                options={parties.map((p) => [p.id, p.nom] as const)}
                allowEmpty
                emptyLabel="Non située"
              />
            </Field>
            <Field className="sm:col-span-2 lg:col-span-3" label="Notes">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={enregistrer} disabled={saving || !form.nom.trim() || !form.reference.trim()}>
              {saving && <Spinner />} {form.id ? 'Enregistrer' : 'Créer'}
            </Button>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Tableau */}
      {equipements.length === 0 && !form ? (
        <div className="mt-4">
          <EmptyState
            title="Aucun équipement"
            actions={
              <Button onClick={() => setForm({ ...vide })}>
                <Plus className="h-4 w-4" /> Ajouter un équipement
              </Button>
            }
          >
            Constituez l'inventaire technique : ascenseurs, groupes électrogènes, pompes, caméras,
            systèmes incendie, piscine… Chaque équipement porte sa catégorie, son état et sa garantie.
          </EmptyState>
        </div>
      ) : equipements.length > 0 ? (
        <div className="mt-4">
          <Table>
            <THead>
              <Th>Équipement</Th>
              <Th>Catégorie</Th>
              <Th>Localisation</Th>
              <Th>Garantie</Th>
              <Th>État</Th>
              <Th className="w-0" />
            </THead>
            <tbody>
              {equipements.map((e) => {
                const garantieExpiree =
                  e.garantieFin && new Date(e.garantieFin).getTime() < Date.now();
                return (
                  <Tr key={e.id}>
                    <Td>
                      <div className="font-medium">{e.nom}</div>
                      <div className="text-2xs text-muted-foreground">
                        {e.reference}
                        {e.fournisseur ? ` · ${e.fournisseur}` : ''}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{LABELS[e.categorie] ?? e.categorie}</Td>
                    <Td className="text-muted-foreground">
                      {[e.batiment?.nom, e.partieCommune?.nom].filter(Boolean).join(' · ') || '—'}
                    </Td>
                    <Td>
                      {e.garantieFin ? (
                        <span className={cn('text-ui', garantieExpiree ? 'text-danger' : 'text-muted-foreground')}>
                          {garantieExpiree ? 'Expirée ' : "jusqu'au "}
                          {formatDate(e.garantieFin)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </Td>
                    <Td>
                      <SearchSelect
                        value={e.etat}
                        onChange={(v) => changerEtat(e, v)}
                        options={EQUIPEMENT_ETATS}
                        className="w-40"
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" aria-label="Modifier" onClick={() => ouvrirEdition(e)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Supprimer" onClick={() => supprimer(e)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : null}
    </Card>
  );
}
