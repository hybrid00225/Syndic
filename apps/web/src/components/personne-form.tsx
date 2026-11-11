'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Trash2, Contact } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { PERSONNE_TYPES, CONTACT_TYPES } from '@/lib/constants';

export interface ContactValue {
  type: string;
  valeur: string;
  libelle: string;
}
export interface PersonneValues {
  type: string;
  nom: string;
  prenom: string;
  contacts: ContactValue[];
}

const EMPTY: PersonneValues = {
  type: 'PHYSIQUE',
  nom: '',
  prenom: '',
  contacts: [],
};

export function PersonneForm({
  initial,
  mode,
  personneId,
}: {
  initial?: Partial<PersonneValues>;
  mode: 'create' | 'edit';
  personneId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PersonneValues>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMorale = form.type === 'MORALE';

  const setContact = (i: number, k: keyof ContactValue, v: string) =>
    setForm((f) => ({
      ...f,
      contacts: f.contacts.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)),
    }));
  const addContact = () =>
    setForm((f) => ({
      ...f,
      contacts: [...f.contacts, { type: 'EMAIL', valeur: '', libelle: '' }],
    }));
  const removeContact = (i: number) =>
    setForm((f) => ({ ...f, contacts: f.contacts.filter((_, idx) => idx !== i) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        type: form.type,
        nom: form.nom,
        prenom: isMorale ? undefined : form.prenom || undefined,
        contacts: form.contacts
          .filter((c) => c.valeur.trim())
          .map((c) => ({
            type: c.type,
            valeur: c.valeur,
            libelle: c.libelle || undefined,
          })),
      };
      if (mode === 'create') {
        await api('/personnes', { method: 'POST', body: JSON.stringify(body) });
      } else {
        await api(`/personnes/${personneId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      router.push(mode === 'edit' ? `/coproprietaires/${personneId}` : '/coproprietaires');
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
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Identité</h2>
            <p className="text-xs text-muted-foreground">
              Personne physique ou morale.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Type</Label>
            <SearchSelect value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={PERSONNE_TYPES} />
          </div>
          <div className="hidden sm:block" />
          <div>
            <Label>{isMorale ? 'Raison sociale *' : 'Nom *'}</Label>
            <Input
              required
              autoFocus
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              placeholder={isMorale ? 'Ex. SCI Les Palmiers' : 'Ex. Koné'}
            />
          </div>
          {!isMorale && (
            <div>
              <Label>Prénom</Label>
              <Input
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                placeholder="Ex. Awa"
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Contact className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Coordonnées</h2>
              <p className="text-xs text-muted-foreground">
                Emails, téléphones, adresses (plusieurs possibles).
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addContact}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {form.contacts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune coordonnée. Cliquez sur « Ajouter ».
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {form.contacts.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <SearchSelect
                  className="w-40"
                  value={c.type}
                  onChange={(v) => setContact(i, 'type', v)}
                  options={CONTACT_TYPES}
                />
                <Input
                  className="min-w-[200px] flex-1"
                  value={c.valeur}
                  onChange={(e) => setContact(i, 'valeur', e.target.value)}
                  placeholder={c.type === 'EMAIL' ? 'nom@exemple.ci' : c.type === 'TELEPHONE' ? '+225 07 00 00 00' : 'Adresse'}
                />
                <Input
                  className="w-40"
                  value={c.libelle}
                  onChange={(e) => setContact(i, 'libelle', e.target.value)}
                  placeholder="Libellé (perso…)"
                />
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  aria-label="Retirer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(mode === 'edit' ? `/coproprietaires/${personneId}` : '/coproprietaires')}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Spinner />}
          {mode === 'create' ? 'Créer le copropriétaire' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
