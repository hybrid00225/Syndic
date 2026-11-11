'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { LOT_TYPES, LOT_STATUTS } from '@/lib/constants';

export interface LotValues {
  reference: string;
  type: string;
  designation: string;
  superficie: string;
  statut: string;
  batimentId: string;
  niveauId: string;
}

interface Batiment {
  id: string;
  nom: string;
}
interface Niveau {
  id: string;
  nom: string;
}

const EMPTY: LotValues = {
  reference: '',
  type: 'APPARTEMENT',
  designation: '',
  superficie: '',
  statut: 'VACANT',
  batimentId: '',
  niveauId: '',
};

export function LotForm({
  coproprieteId,
  mode,
  lotId,
  initial,
}: {
  coproprieteId: string;
  mode: 'create' | 'edit';
  lotId?: string;
  initial?: Partial<LotValues>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<LotValues>({ ...EMPTY, ...initial });
  const [batiments, setBatiments] = useState<Batiment[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof LotValues, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    api<Batiment[]>(`/coproprietes/${coproprieteId}/batiments`)
      .then(setBatiments)
      .catch(() => setBatiments([]));
  }, [coproprieteId]);

  useEffect(() => {
    if (!form.batimentId) {
      setNiveaux([]);
      return;
    }
    api<Niveau[]>(`/batiments/${form.batimentId}/niveaux`)
      .then(setNiveaux)
      .catch(() => setNiveaux([]));
  }, [form.batimentId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        reference: form.reference,
        type: form.type,
        designation: form.designation || undefined,
        superficie: form.superficie ? Number(form.superficie) : undefined,
        statut: form.statut,
        batimentId: form.batimentId || undefined,
        niveauId: form.batimentId && form.niveauId ? form.niveauId : undefined,
      };
      if (mode === 'create') {
        await api(`/coproprietes/${coproprieteId}/lots`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } else {
        await api(`/lots/${lotId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      router.push(`/coproprietes/${coproprieteId}?tab=patrimoine`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold">Identification</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Référence *</Label>
            <Input
              required
              autoFocus
              value={form.reference}
              onChange={(e) => set('reference', e.target.value)}
              placeholder="Ex. A101"
            />
          </div>
          <div>
            <Label>Type</Label>
            <SearchSelect value={form.type} onChange={(v) => set('type', v)} options={LOT_TYPES} />
          </div>
          <div className="sm:col-span-2">
            <Label>Désignation</Label>
            <Input
              value={form.designation}
              onChange={(e) => set('designation', e.target.value)}
              placeholder="Ex. Appartement 3 pièces, 2e étage"
            />
          </div>
          <div>
            <Label>Superficie privative (m²)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.superficie}
              onChange={(e) => set('superficie', e.target.value)}
              placeholder="Ex. 75"
            />
          </div>
          <div>
            <Label>Statut d&apos;occupation</Label>
            <SearchSelect value={form.statut} onChange={(v) => set('statut', v)} options={LOT_STATUTS} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-sm font-semibold">Localisation dans la copropriété</h2>
        <p className="text-xs text-muted-foreground">
          Rattachement optionnel à un bâtiment et un niveau.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Bâtiment</Label>
            <SearchSelect
              value={form.batimentId}
              onChange={(v) => {
                set('batimentId', v);
                set('niveauId', '');
              }}
              options={batiments.map((b) => [b.id, b.nom] as const)}
              allowEmpty
            />
          </div>
          <div>
            <Label>Niveau</Label>
            <SearchSelect
              value={form.niveauId}
              onChange={(v) => set('niveauId', v)}
              options={niveaux.map((n) => [n.id, n.nom] as const)}
              allowEmpty
              disabled={!form.batimentId}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/coproprietes/${coproprieteId}?tab=patrimoine`)}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          {mode === 'create' ? 'Créer le lot' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
