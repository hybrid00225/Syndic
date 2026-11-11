'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Wallet, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  PAYS,
  STATUTS_COPRO,
  TYPES_COPRO,
  NATURE_SYNDIC,
  DEVISES,
} from '@/lib/constants';

export interface CoproValues {
  nom: string;
  reference: string;
  type: string;
  pays: string;
  adresse: string;
  ensembleImmobilier: string;
  devise: string;
  natureSyndic: string;
  description: string;
  dateMiseExploitation: string;
  statut?: string;
}

const EMPTY: CoproValues = {
  nom: '',
  reference: '',
  type: 'RESIDENTIEL',
  pays: 'CI',
  adresse: '',
  ensembleImmobilier: '',
  devise: 'XOF',
  natureSyndic: 'PROFESSIONNEL',
  description: '',
  dateMiseExploitation: '',
  statut: 'EN_CREATION',
};

export function CoproForm({
  initial,
  mode,
  coproprieteId,
}: {
  initial?: Partial<CoproValues>;
  mode: 'create' | 'edit';
  coproprieteId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CoproValues>({ ...EMPTY, ...initial });
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
        reference: form.reference || undefined,
        type: form.type,
        pays: form.pays,
        adresse: form.adresse || undefined,
        ensembleImmobilier: form.ensembleImmobilier || undefined,
        devise: form.devise,
        natureSyndic: form.natureSyndic,
        description: form.description || undefined,
        dateMiseExploitation: form.dateMiseExploitation || undefined,
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
      router.push(mode === 'edit' ? `/coproprietes/${coproprieteId}` : '/coproprietes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Identité */}
      <Section icon={Building2} title="Identité" desc="Nom, référence et nature de la copropriété.">
        <div className="sm:col-span-2">
          <Label>Nom de la copropriété *</Label>
          <Input
            required
            autoFocus
            value={form.nom}
            onChange={(e) => set('nom', e.target.value)}
            placeholder="Ex. Résidence Les Palmiers"
          />
        </div>
        <div>
          <Label>Référence interne</Label>
          <Input
            value={form.reference}
            onChange={(e) => set('reference', e.target.value)}
            placeholder="Ex. COP-001"
          />
        </div>
        <div>
          <Label>Type</Label>
          <SearchSelect value={form.type} onChange={(v) => set('type', v)} options={TYPES_COPRO} />
        </div>
      </Section>

      {/* Localisation */}
      <Section icon={MapPin} title="Localisation" desc="Pays, adresse et rattachement.">
        <div>
          <Label>Pays *</Label>
          <SearchSelect value={form.pays} onChange={(v) => set('pays', v)} options={PAYS} />
        </div>
        <div>
          <Label>Ensemble immobilier / résidence</Label>
          <Input
            value={form.ensembleImmobilier}
            onChange={(e) => set('ensembleImmobilier', e.target.value)}
            placeholder="Ex. Cité des Palmiers"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Adresse</Label>
          <Input
            value={form.adresse}
            onChange={(e) => set('adresse', e.target.value)}
            placeholder="Quartier, ville"
          />
        </div>
      </Section>

      {/* Paramètres financiers & juridiques */}
      <Section
        icon={Wallet}
        title="Paramètres financiers & administration"
        desc="Devise, mode de gestion, dates et statut."
      >
        <div>
          <Label>Devise</Label>
          <SearchSelect value={form.devise} onChange={(v) => set('devise', v)} options={DEVISES} />
        </div>
        <div>
          <Label>Administration par un syndic</Label>
          <SearchSelect
            value={form.natureSyndic}
            onChange={(v) => set('natureSyndic', v)}
            options={NATURE_SYNDIC}
          />
        </div>
        <div>
          <Label>Date de mise en exploitation</Label>
          <Input
            type="date"
            value={form.dateMiseExploitation}
            onChange={(e) => set('dateMiseExploitation', e.target.value)}
          />
        </div>
        {mode === 'edit' && (
          <div>
            <Label>Statut</Label>
            <SearchSelect
              value={form.statut ?? ''}
              onChange={(v) => set('statut', v)}
              options={STATUTS_COPRO}
            />
          </div>
        )}
      </Section>

      {/* Description */}
      <Section icon={FileText} title="Description" desc="Notes libres (parties communes, particularités…).">
        <div className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Informations complémentaires…"
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </Section>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            router.push(
              mode === 'edit' ? `/coproprietes/${coproprieteId}` : '/coproprietes',
            )
          }
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

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Building2;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
