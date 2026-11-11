'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { PAYS, STATUTS_COPRO } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface CoproValues {
  nom: string;
  pays: string;
  adresse: string;
  statut?: string;
}

const selectCls =
  'flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30';

// Formulaire partagé création / édition (en PAGE, pas en modal).
export function CoproForm({
  initial,
  mode,
  coproprieteId,
}: {
  initial?: CoproValues;
  mode: 'create' | 'edit';
  coproprieteId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CoproValues>(
    initial ?? { nom: '', pays: 'CI', adresse: '', statut: 'EN_CREATION' },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof CoproValues, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        nom: form.nom,
        pays: form.pays,
        adresse: form.adresse || undefined,
        ...(mode === 'edit' ? { statut: form.statut } : {}),
      };
      if (mode === 'create') {
        await api('/coproprietes', { method: 'POST', body: JSON.stringify(body) });
      } else {
        await api(`/coproprietes/${coproprieteId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      router.push('/coproprietes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold">Informations générales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nom de la copropriété</Label>
            <Input
              required
              autoFocus
              value={form.nom}
              onChange={(e) => set('nom', e.target.value)}
              placeholder="Ex. Résidence Les Palmiers"
            />
          </div>
          <div>
            <Label>Pays</Label>
            <select
              className={cn(selectCls, 'cursor-pointer')}
              value={form.pays}
              onChange={(e) => set('pays', e.target.value)}
            >
              {PAYS.map(([code, nom]) => (
                <option key={code} value={code}>
                  {nom}
                </option>
              ))}
            </select>
          </div>
          {mode === 'edit' && (
            <div>
              <Label>Statut</Label>
              <select
                className={cn(selectCls, 'cursor-pointer')}
                value={form.statut}
                onChange={(e) => set('statut', e.target.value)}
              >
                {STATUTS_COPRO.map(([code, nom]) => (
                  <option key={code} value={code}>
                    {nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>Adresse (optionnel)</Label>
            <Input
              value={form.adresse}
              onChange={(e) => set('adresse', e.target.value)}
              placeholder="Quartier, ville"
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
          onClick={() => router.push('/coproprietes')}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          {mode === 'create' ? 'Créer la copropriété' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
