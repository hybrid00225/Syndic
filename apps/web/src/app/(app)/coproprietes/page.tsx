'use client';

import { useEffect, useState } from 'react';
import { Plus, Home, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageLoader, Spinner } from '@/components/ui/spinner';
import { STATUT_COPRO } from '@/lib/utils';

interface Copropriete {
  id: string;
  nom: string;
  pays: string;
  adresse: string | null;
  statut: string;
}

const statutTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  EN_CREATION: 'warning',
  INACTIVE: 'neutral',
  CLOTUREE: 'neutral',
};

export default function CoproprietesPage() {
  const [copros, setCopros] = useState<Copropriete[] | null>(null);
  const [open, setOpen] = useState(false);

  const charger = () =>
    api<Copropriete[]>('/coproprietes').then(setCopros).catch(() => setCopros([]));

  useEffect(() => {
    charger();
  }, []);

  if (!copros) return <PageLoader />;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Copropriétés</h1>
          <p className="mt-1 text-muted-foreground">
            {copros.length} copropriété{copros.length > 1 ? 's' : ''} gérée
            {copros.length > 1 ? 's' : ''}.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nouvelle copropriété
        </Button>
      </div>

      {copros.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Home className="h-7 w-7" />
            </div>
            <p className="mt-4 font-medium">Aucune copropriété</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez votre première copropriété pour commencer.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Créer une copropriété
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {copros.map((c) => (
            <Card key={c.id} className="transition-shadow hover:shadow-lift">
              <CardContent className="flex items-start justify-between pt-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{c.nom}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.adresse ? `${c.adresse} · ` : ''}
                      {c.pays}
                    </p>
                  </div>
                </div>
                <Badge tone={statutTone[c.statut] ?? 'neutral'} dot>
                  {STATUT_COPRO[c.statut] ?? c.statut}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <CreateModal
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            charger();
          }}
        />
      )}
    </div>
  );
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ nom: '', pays: 'CI', adresse: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/coproprietes', {
        method: 'POST',
        body: JSON.stringify({
          nom: form.nom,
          pays: form.pays,
          adresse: form.adresse || undefined,
        }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-semibold">Nouvelle copropriété</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <Label>Nom</Label>
            <Input
              required
              autoFocus
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex. Résidence Les Palmiers"
            />
          </div>
          <div>
            <Label>Pays (code ISO)</Label>
            <Input
              required
              value={form.pays}
              onChange={(e) => setForm({ ...form, pays: e.target.value })}
              placeholder="CI"
            />
          </div>
          <div>
            <Label>Adresse (optionnel)</Label>
            <Input
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              placeholder="Cocody, Abidjan"
            />
          </div>
          {error && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner />} Créer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
