'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Users, X, Building, UserIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, cn } from '@/lib/utils';
import { NATURE_DROIT, LABELS } from '@/lib/constants';

interface Personne {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
}
interface Detention {
  id: string;
  quotePartNum: number;
  quotePartDen: number;
  natureDroit: string;
  dateDebut: string;
  dateFin: string | null;
  personne: Personne;
}

const nomP = (p: Personne) =>
  p.type === 'MORALE' ? p.nom : `${p.prenom ?? ''} ${p.nom}`.trim();

export function LotProprietaires({ lotId }: { lotId: string }) {
  const confirm = useConfirm();
  const [detentions, setDetentions] = useState<Detention[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [open, setOpen] = useState(false);

  const charger = () =>
    api<Detention[]>(`/lots/${lotId}/detentions`).then(setDetentions).catch(() => setDetentions([]));
  useEffect(() => {
    charger();
    api<Personne[]>('/personnes').then(setPersonnes).catch(() => setPersonnes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  const retirer = async (d: Detention) => {
    const ok = await confirm({
      title: `Retirer « ${nomP(d.personne)} » ?`,
      description: 'La détention de propriété sera supprimée de ce lot.',
      nextAction: "L'historique de la personne est conservé.",
      confirmLabel: 'Retirer',
      tone: 'danger',
    });
    if (!ok) return;
    await api(`/detentions/${d.id}`, { method: 'DELETE' });
    charger();
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Propriétaires</h2>
            <p className="text-xs text-muted-foreground">
              Qui détient ce lot, et selon quelle quote-part.
            </p>
          </div>
        </div>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter un propriétaire
        </Button>
      </div>

      {detentions.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium">Aucun propriétaire</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Attribuez ce lot à un ou plusieurs copropriétaires.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="border border-border px-3 py-2.5 font-semibold">Propriétaire</th>
                <th className="border border-border px-3 py-2.5 font-semibold">Quote-part</th>
                <th className="border border-border px-3 py-2.5 font-semibold">Nature</th>
                <th className="border border-border px-3 py-2.5 font-semibold">Période</th>
                <th className="border border-border px-3 py-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {detentions.map((d) => (
                <tr key={d.id} className="bg-card">
                  <td className="border border-border px-3 py-2.5">
                    <span className="flex items-center gap-2 font-medium">
                      {d.personne.type === 'MORALE' ? (
                        <Building className="h-4 w-4 text-info" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-primary" />
                      )}
                      {nomP(d.personne)}
                    </span>
                  </td>
                  <td className="border border-border px-3 py-2.5 nums">
                    {d.quotePartNum}/{d.quotePartDen}
                  </td>
                  <td className="border border-border px-3 py-2.5">
                    <Badge tone="neutral">{LABELS[d.natureDroit] ?? d.natureDroit}</Badge>
                  </td>
                  <td className="border border-border px-3 py-2.5 text-muted-foreground">
                    {formatDate(d.dateDebut)}
                    {d.dateFin ? ` → ${formatDate(d.dateFin)}` : ' → en cours'}
                  </td>
                  <td className="border border-border px-3 py-2.5">
                    <div className="flex justify-end">
                      <Tooltip label="Retirer">
                        <button
                          onClick={() => retirer(d)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <AjoutModal
          lotId={lotId}
          personnes={personnes}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            charger();
          }}
        />
      )}
    </Card>
  );
}

function AjoutModal({
  lotId,
  personnes,
  onClose,
  onDone,
}: {
  lotId: string;
  personnes: Personne[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [personneId, setPersonneId] = useState('');
  const [num, setNum] = useState('1');
  const [den, setDen] = useState('1');
  const [nature, setNature] = useState('PLEINE_PROPRIETE');
  const [dateDebut, setDateDebut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api(`/lots/${lotId}/detentions`, {
        method: 'POST',
        body: JSON.stringify({
          personneId,
          quotePartNum: Number(num),
          quotePartDen: Number(den),
          natureDroit: nature,
          dateDebut: new Date(dateDebut || Date.now()).toISOString(),
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">Ajouter un propriétaire</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-4">
          <div>
            <Label>Copropriétaire *</Label>
            <SearchSelect
              value={personneId}
              onChange={setPersonneId}
              options={personnes.map((p) => [p.id, nomP(p)] as const)}
              allowEmpty
              emptyLabel="— Choisir —"
              placeholder="— Choisir —"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quote-part (num.)</Label>
              <Input type="number" min={1} value={num} onChange={(e) => setNum(e.target.value)} />
            </div>
            <div>
              <Label>Quote-part (dén.)</Label>
              <Input type="number" min={1} value={den} onChange={(e) => setDen(e.target.value)} />
            </div>
          </div>
          <p className={cn('text-xs', Number(num) > Number(den) ? 'text-danger' : 'text-muted-foreground')}>
            Part détenue : {num}/{den}
            {Number(num) > Number(den) ? ' — invalide (ne peut dépasser 1)' : ''}
          </p>
          <div>
            <Label>Nature du droit</Label>
            <SearchSelect value={nature} onChange={setNature} options={NATURE_DROIT} />
          </div>
          <div>
            <Label>Date de début *</Label>
            <Input type="date" required value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </div>

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading || !personneId}>
              {loading && <Spinner />} Ajouter
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
