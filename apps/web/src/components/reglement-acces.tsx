'use client';

import { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  ScrollText,
  DoorOpen,
  X,
  Download,
  Upload,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { api, fetchDocument } from '@/lib/api';
import { useDocumentPreview } from '@/components/ui/document-preview';
import { useApi, useInvalidate } from '@/lib/query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { IconButton } from '@/components/ui/icon-button';
import { SearchSelect } from '@/components/ui/select';
import { Spinner, PageLoader } from '@/components/ui/spinner';
import { useAlert, useConfirm } from '@/components/ui/confirm';
import { ErrorState } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';
import { LABELS, ACCES_TYPES } from '@/lib/constants';

interface Ref {
  id: string;
  nom: string;
}
interface DocumentMeta {
  id: string;
  nomOriginal: string;
  mimeType: string;
  taille: number;
}
interface ReglementVersion {
  id: string;
  version: number;
  dateAdoption: string | null;
  reference: string | null;
  description: string | null;
  document: DocumentMeta | null;
  courant: boolean;
}
interface Acces {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  batiment: Ref | null;
}

export function ReglementAcces({ coproprieteId }: { coproprieteId: string }) {
  const reglements = useApi<ReglementVersion[]>(`/coproprietes/${coproprieteId}/reglement-versions`);
  const acces = useApi<Acces[]>(`/coproprietes/${coproprieteId}/acces`);
  const batiments = useApi<Ref[]>(`/coproprietes/${coproprieteId}/batiments`);

  if (reglements.isLoading || acces.isLoading) {
    return <PageLoader label="Chargement du règlement et des accès…" />;
  }
  if (reglements.error) {
    return <ErrorState error={reglements.error} onRetry={() => reglements.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <Reglement coproprieteId={coproprieteId} versions={reglements.data ?? []} />
      <AccesSection
        coproprieteId={coproprieteId}
        acces={acces.data ?? []}
        batiments={batiments.data ?? []}
      />
    </div>
  );
}

// --- Règlement de copropriété ----------------------------------------------

const videReglement = { dateAdoption: '', reference: '', description: '', documentId: '' };

const koMo = (o: number) => (o < 1024 * 1024 ? `${Math.round(o / 1024)} Ko` : `${(o / (1024 * 1024)).toFixed(1)} Mo`);

function Reglement({
  coproprieteId,
  versions,
}: {
  coproprieteId: string;
  versions: ReglementVersion[];
}) {
  const invalidate = useInvalidate();
  const confirm = useConfirm();
  const alert = useAlert();
  const preview = useDocumentPreview();
  const [form, setForm] = useState<
    (typeof videReglement & { id?: string; documentNom?: string }) | null
  >(null);
  const [fichier, setFichier] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = () => invalidate(`/coproprietes/${coproprieteId}/reglement-versions`);

  const ouvrir = (f: (typeof videReglement & { id?: string; documentNom?: string }) | null) => {
    setFichier(null);
    setForm(f);
  };

  const enregistrer = async () => {
    if (!form) return;
    setSaving(true);
    try {
      // 1) Upload éventuel du fichier → documentId.
      let documentId = form.documentId || undefined;
      if (fichier) {
        const data = new FormData();
        data.append('fichier', fichier);
        const doc = await api<{ id: string }>(
          `/coproprietes/${coproprieteId}/documents`,
          { method: 'POST', body: data },
        );
        documentId = doc.id;
      }
      // 2) Création / mise à jour de la version.
      const body = {
        dateAdoption: form.dateAdoption || undefined,
        reference: form.reference || undefined,
        description: form.description || undefined,
        documentId,
      };
      if (form.id) {
        await api(`/reglement-versions/${form.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api(`/coproprietes/${coproprieteId}/reglement-versions`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      ouvrir(null);
      refresh();
    } catch (e) {
      alert('Enregistrement impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  const definirCourante = async (v: ReglementVersion) => {
    try {
      await api(`/reglement-versions/${v.id}/courant`, { method: 'PATCH' });
      refresh();
    } catch (e) {
      alert('Action impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  const supprimer = async (v: ReglementVersion) => {
    const ok = await confirm({
      title: `Supprimer la version ${v.version} ?`,
      description: 'Cette version du règlement sera définitivement supprimée.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/reglement-versions/${v.id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      alert('Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-ui font-semibold">
            <ScrollText className="h-4 w-4 text-muted-foreground" /> Règlement de copropriété
          </h3>
          <p className="text-2xs text-muted-foreground">
            Conservé en versions successives. Une modification ne recalcule jamais les opérations
            passées.
          </p>
        </div>
        {!form && (
          <Button size="sm" onClick={() => ouvrir({ ...videReglement })}>
            <Plus className="h-4 w-4" /> Nouvelle version
          </Button>
        )}
      </div>

      {form && (
        <Modal
          size="lg"
          title={form.id ? 'Modifier la version' : 'Nouvelle version du règlement'}
          onClose={() => ouvrir(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => ouvrir(null)}>
                Annuler
              </Button>
              <Button onClick={enregistrer} disabled={saving}>
                {saving && <Spinner />} {form.id ? 'Enregistrer' : 'Créer la version'}
              </Button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date d'adoption" hint="Entrée en vigueur.">
              <Input type="date" value={form.dateAdoption} onChange={(e) => setForm({ ...form, dateAdoption: e.target.value })} />
            </Field>
            <Field label="Référence" hint="Ex. acte notarié, n° de dépôt.">
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Acte du 12/03/2020" />
            </Field>
            <Field className="sm:col-span-2" label="Document (PDF)" hint="Téléversez le fichier du règlement (PDF, image — 15 Mo max).">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                  <Upload className="h-4 w-4" /> Choisir un fichier
                </Button>
                {fichier ? (
                  <span className="flex items-center gap-2 text-ui">
                    <FileText className="h-4 w-4 text-primary" />
                    {fichier.name} <span className="text-2xs text-muted-foreground">({koMo(fichier.size)})</span>
                    <IconButton
                      label="Retirer le fichier"
                      icon={X}
                      size="xs"
                      tone="danger"
                      onClick={() => {
                        setFichier(null);
                        if (fileInput.current) fileInput.current.value = '';
                      }}
                    />
                  </span>
                ) : form.documentNom ? (
                  <span className="flex items-center gap-2 text-ui text-muted-foreground">
                    <FileText className="h-4 w-4" /> {form.documentNom}
                    <span className="text-2xs">(conservé — choisissez un fichier pour le remplacer)</span>
                  </span>
                ) : (
                  <span className="text-2xs text-muted-foreground">Aucun fichier.</span>
                )}
              </div>
            </Field>
            <Field className="sm:col-span-2" label="Description / modifications">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Objet de cette version…" />
            </Field>
          </div>
        </Modal>
      )}

      {versions.length === 0 ? (
        <p className="mt-4 text-ui text-muted-foreground">
          Aucun règlement enregistré. Ajoutez la première version (acte, date d'adoption, document).
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {versions.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border p-3"
            >
              <span className="font-display text-base font-semibold tabular-nums">v{v.version}</span>
              {v.courant ? (
                <Badge tone="success" dot>
                  En vigueur
                </Badge>
              ) : (
                <Badge tone="neutral" dot>
                  Antérieure
                </Badge>
              )}
              <span className="text-ui text-muted-foreground">
                {v.dateAdoption ? `Adoptée le ${formatDate(v.dateAdoption)}` : 'Date non précisée'}
                {v.reference ? ` · ${v.reference}` : ''}
              </span>
              {v.document && (
                <Button variant="link" className="gap-1.5 text-ui" onClick={() => {
                    const doc = v.document!;
                    preview({
                      title: `Règlement de copropriété · v${v.version}`,
                      description: doc.nomOriginal,
                      load: () => fetchDocument(`/documents/${doc.id}/download`, doc.nomOriginal),
                    });
                  }}>
                  <Download className="h-3.5 w-3.5" /> {v.document.nomOriginal}
                </Button>
              )}
              {v.description && <span className="w-full text-2xs text-muted-foreground">{v.description}</span>}
              <div className="ml-auto flex items-center gap-1">
                {!v.courant && (
                  <IconButton label="Définir comme version en vigueur" icon={CheckCircle2} tone="success" onClick={() => definirCourante(v)} />
                )}
                <IconButton
                  label="Modifier"
                  icon={Pencil}
                  onClick={() =>
                    ouvrir({
                      id: v.id,
                      dateAdoption: v.dateAdoption?.slice(0, 10) ?? '',
                      reference: v.reference ?? '',
                      description: v.description ?? '',
                      documentId: v.document?.id ?? '',
                      documentNom: v.document?.nomOriginal,
                    })
                  }
                />
                <IconButton label="Supprimer" icon={Trash2} tone="danger" onClick={() => supprimer(v)} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// --- Accès ------------------------------------------------------------------

function AccesSection({
  coproprieteId,
  acces,
  batiments,
}: {
  coproprieteId: string;
  acces: Acces[];
  batiments: Ref[];
}) {
  const invalidate = useInvalidate();
  const confirm = useConfirm();
  const alert = useAlert();
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState('PIETON');
  const [batimentId, setBatimentId] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = () => invalidate(`/coproprietes/${coproprieteId}/acces`);

  const ajouter = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      await api(`/coproprietes/${coproprieteId}/acces`, {
        method: 'POST',
        body: JSON.stringify({ nom: nom.trim(), type, batimentId: batimentId || undefined }),
      });
      setNom('');
      setType('PIETON');
      setBatimentId('');
      setOpen(false);
      refresh();
    } catch (e) {
      alert('Création impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  const supprimer = async (a: Acces) => {
    const ok = await confirm({
      title: `Supprimer « ${a.nom} » ?`,
      description: 'Cet accès sera définitivement supprimé.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/acces/${a.id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      alert('Suppression impossible', e instanceof Error ? e.message : 'Erreur inconnue.');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-ui font-semibold">
            <DoorOpen className="h-4 w-4 text-muted-foreground" /> Accès
          </h3>
          <p className="text-2xs text-muted-foreground">
            Entrées, portails, parkings, accès secours… de la copropriété.
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
            <Input autoFocus value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Entrée principale, portail parking…" />
          </Field>
          <Field label="Type">
            <SearchSelect value={type} onChange={setType} options={ACCES_TYPES} />
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

      {acces.length === 0 ? (
        <p className="mt-4 text-ui text-muted-foreground">Aucun accès déclaré.</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {acces.map((a) => (
            <li
              key={a.id}
              className="group flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-ui"
            >
              <span className="font-medium">{a.nom}</span>
              <Badge tone="neutral" dot>
                {LABELS[a.type] ?? a.type}
              </Badge>
              {a.batiment && <span className="text-2xs text-muted-foreground">· {a.batiment.nom}</span>}
              <IconButton
                label={`Supprimer ${a.nom}`}
                icon={X}
                size="xs"
                tone="danger"
                revealOnHover
                onClick={() => supprimer(a)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
