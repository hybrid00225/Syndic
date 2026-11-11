'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Wallet,
  FileText,
  Plus,
  Trash2,
  Layers,
  Home,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  PAYS,
  TYPES_COPRO,
  NATURE_SYNDIC,
  DEVISES,
  MODES_REPARTITION,
  LOT_TYPES,
  LOT_STATUTS,
} from '@/lib/constants';

interface NiveauW {
  nom: string;
}
interface BatimentW {
  nom: string;
  niveaux: NiveauW[];
}
interface LotW {
  reference: string;
  type: string;
  superficie: string;
  statut: string;
  batimentIndex: string;
  niveauIndex: string;
}

const STEPS = ['Informations', 'Bâtiments & niveaux', 'Lots', 'Récapitulatif'];

export function CoproWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copro, setCopro] = useState({
    nom: '',
    reference: '',
    type: 'RESIDENTIEL',
    pays: 'CI',
    adresse: '',
    ensembleImmobilier: '',
    devise: 'XOF',
    natureSyndic: 'PROFESSIONNEL',
    modeRepartition: 'TANTIEMES',
    description: '',
    dateMiseExploitation: '',
  });
  const [batiments, setBatiments] = useState<BatimentW[]>([]);
  const [lots, setLots] = useState<LotW[]>([]);

  const setC = (k: string, v: string) => setCopro((f) => ({ ...f, [k]: v }));

  const addBatiment = () => setBatiments((b) => [...b, { nom: '', niveaux: [] }]);
  const setBatNom = (i: number, v: string) =>
    setBatiments((b) => b.map((x, idx) => (idx === i ? { ...x, nom: v } : x)));
  const removeBatiment = (i: number) =>
    setBatiments((b) => b.filter((_, idx) => idx !== i));
  const addNiveau = (bi: number) =>
    setBatiments((b) =>
      b.map((x, idx) => (idx === bi ? { ...x, niveaux: [...x.niveaux, { nom: '' }] } : x)),
    );
  const setNivNom = (bi: number, ni: number, v: string) =>
    setBatiments((b) =>
      b.map((x, idx) =>
        idx === bi
          ? { ...x, niveaux: x.niveaux.map((n, j) => (j === ni ? { nom: v } : n)) }
          : x,
      ),
    );
  const removeNiveau = (bi: number, ni: number) =>
    setBatiments((b) =>
      b.map((x, idx) =>
        idx === bi ? { ...x, niveaux: x.niveaux.filter((_, j) => j !== ni) } : x,
      ),
    );

  const addLot = () =>
    setLots((l) => [
      ...l,
      { reference: '', type: 'APPARTEMENT', superficie: '', statut: 'VACANT', batimentIndex: '', niveauIndex: '' },
    ]);
  const setLot = (i: number, k: keyof LotW, v: string) =>
    setLots((l) => l.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const removeLot = (i: number) => setLots((l) => l.filter((_, idx) => idx !== i));

  const canNext =
    step === 0 ? copro.nom.trim() && copro.pays : true;

  const creer = async () => {
    setError(null);
    setLoading(true);
    try {
      const body = {
        ...copro,
        reference: copro.reference || undefined,
        adresse: copro.adresse || undefined,
        ensembleImmobilier: copro.ensembleImmobilier || undefined,
        description: copro.description || undefined,
        dateMiseExploitation: copro.dateMiseExploitation || undefined,
        batiments: batiments
          .filter((b) => b.nom.trim())
          .map((b) => ({
            nom: b.nom,
            niveaux: b.niveaux.filter((n) => n.nom.trim()).map((n) => ({ nom: n.nom })),
          })),
        lots: lots
          .filter((l) => l.reference.trim())
          .map((l) => ({
            reference: l.reference,
            type: l.type,
            superficie: l.superficie ? Number(l.superficie) : undefined,
            statut: l.statut,
            batimentIndex: l.batimentIndex !== '' ? Number(l.batimentIndex) : undefined,
            niveauIndex:
              l.batimentIndex !== '' && l.niveauIndex !== '' ? Number(l.niveauIndex) : undefined,
          })),
      };
      const res = await api<{ id: string }>('/coproprietes/complete', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/coproprietes/${res.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
                i === step
                  ? 'bg-primary/10 text-primary'
                  : i < step
                    ? 'text-foreground hover:bg-muted'
                    : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                  i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Étape 1 */}
      {step === 0 && (
        <>
          <WCard icon={Building2} title="Identité">
            <div className="sm:col-span-2">
              <Label>Nom de la copropriété *</Label>
              <Input required autoFocus value={copro.nom} onChange={(e) => setC('nom', e.target.value)} placeholder="Ex. Résidence Les Palmiers" />
            </div>
            <div>
              <Label>Référence</Label>
              <Input value={copro.reference} onChange={(e) => setC('reference', e.target.value)} placeholder="COP-001" />
            </div>
            <div>
              <Label>Type</Label>
              <SearchSelect value={copro.type} onChange={(v) => setC('type', v)} options={TYPES_COPRO} />
            </div>
          </WCard>
          <WCard icon={MapPin} title="Localisation">
            <div>
              <Label>Pays *</Label>
              <SearchSelect value={copro.pays} onChange={(v) => setC('pays', v)} options={PAYS} />
            </div>
            <div>
              <Label>Ensemble immobilier</Label>
              <Input value={copro.ensembleImmobilier} onChange={(e) => setC('ensembleImmobilier', e.target.value)} placeholder="Cité des Palmiers" />
            </div>
            <div className="sm:col-span-2">
              <Label>Adresse</Label>
              <Input value={copro.adresse} onChange={(e) => setC('adresse', e.target.value)} placeholder="Quartier, ville" />
            </div>
          </WCard>
          <WCard icon={Wallet} title="Paramètres & administration">
            <div>
              <Label>Devise</Label>
              <SearchSelect value={copro.devise} onChange={(v) => setC('devise', v)} options={DEVISES} />
            </div>
            <div>
              <Label>Administration</Label>
              <SearchSelect value={copro.natureSyndic} onChange={(v) => setC('natureSyndic', v)} options={NATURE_SYNDIC} />
            </div>
            <div>
              <Label>Mode de répartition</Label>
              <SearchSelect value={copro.modeRepartition} onChange={(v) => setC('modeRepartition', v)} options={MODES_REPARTITION} />
            </div>
            <div>
              <Label>Date de mise en exploitation</Label>
              <Input type="date" value={copro.dateMiseExploitation} onChange={(e) => setC('dateMiseExploitation', e.target.value)} />
            </div>
          </WCard>
          <WCard icon={FileText} title="Description">
            <div className="sm:col-span-2">
              <textarea value={copro.description} onChange={(e) => setC('description', e.target.value)} rows={2} placeholder="Notes…" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
            </div>
          </WCard>
        </>
      )}

      {/* Étape 2 */}
      {step === 1 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Bâtiments & niveaux</h2>
            <Button type="button" size="sm" onClick={addBatiment}>
              <Plus className="h-4 w-4" /> Ajouter un bâtiment
            </Button>
          </div>
          {batiments.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun bâtiment (optionnel). Vous pourrez en ajouter plus tard.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {batiments.map((b, bi) => (
                <div key={bi} className="rounded-lg border border-border p-3.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <Input value={b.nom} onChange={(e) => setBatNom(bi, e.target.value)} placeholder={`Bâtiment ${bi + 1}`} className="flex-1" />
                    <Button type="button" variant="secondary" size="sm" onClick={() => addNiveau(bi)}>
                      <Plus className="h-4 w-4" /> Niveau
                    </Button>
                    <button type="button" onClick={() => removeBatiment(bi)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {b.niveaux.length > 0 && (
                    <div className="mt-2.5 space-y-2 pl-6">
                      {b.niveaux.map((n, ni) => (
                        <div key={ni} className="flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input value={n.nom} onChange={(e) => setNivNom(bi, ni, e.target.value)} placeholder="Ex. RDC, 1er étage" className="flex-1" />
                          <button type="button" onClick={() => removeNiveau(bi, ni)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Étape 3 */}
      {step === 2 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Lots</h2>
            <Button type="button" size="sm" onClick={addLot}>
              <Plus className="h-4 w-4" /> Ajouter un lot
            </Button>
          </div>
          {lots.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun lot (optionnel). Vous pourrez en ajouter plus tard.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lots.map((l, i) => {
                const niveauxOptions =
                  l.batimentIndex !== '' && batiments[Number(l.batimentIndex)]
                    ? batiments[Number(l.batimentIndex)].niveaux.map(
                        (n, ni) => [String(ni), n.nom || `Niveau ${ni + 1}`] as const,
                      )
                    : [];
                return (
                  <div key={i} className="rounded-lg border border-border p-3.5">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Input value={l.reference} onChange={(e) => setLot(i, 'reference', e.target.value)} placeholder="Référence (ex. A101)" />
                      <SearchSelect value={l.type} onChange={(v) => setLot(i, 'type', v)} options={LOT_TYPES} />
                      <Input type="number" min={0} value={l.superficie} onChange={(e) => setLot(i, 'superficie', e.target.value)} placeholder="Superficie (m²)" />
                      <SearchSelect value={l.statut} onChange={(v) => setLot(i, 'statut', v)} options={LOT_STATUTS} />
                      <SearchSelect
                        value={l.batimentIndex}
                        onChange={(v) => {
                          setLot(i, 'batimentIndex', v);
                          setLot(i, 'niveauIndex', '');
                        }}
                        options={batiments.map((b, bi) => [String(bi), b.nom || `Bâtiment ${bi + 1}`] as const)}
                        allowEmpty
                        emptyLabel="Aucun bâtiment"
                      />
                      <div className="flex items-center gap-2">
                        <SearchSelect
                          className="flex-1"
                          value={l.niveauIndex}
                          onChange={(v) => setLot(i, 'niveauIndex', v)}
                          options={niveauxOptions}
                          allowEmpty
                          emptyLabel="Aucun niveau"
                          disabled={l.batimentIndex === ''}
                        />
                        <button type="button" onClick={() => removeLot(i)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Étape 4 */}
      {step === 3 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-sm font-semibold">Récapitulatif</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Reca label="Nom" value={copro.nom || '—'} />
            <Reca label="Type" value={TYPES_COPRO.find((t) => t[0] === copro.type)?.[1] ?? copro.type} />
            <Reca label="Pays" value={copro.pays} />
            <Reca label="Devise" value={copro.devise} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            <Pill icon={Building2} label="Bâtiments" value={batiments.filter((b) => b.nom.trim()).length} />
            <Pill icon={Layers} label="Niveaux" value={batiments.reduce((s, b) => s + b.niveaux.filter((n) => n.nom.trim()).length, 0)} />
            <Pill icon={Home} label="Lots" value={lots.filter((l) => l.reference.trim()).length} />
          </div>
          {error && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => (step === 0 ? router.push('/coproprietes') : setStep((s) => s - 1))}>
          <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Annuler' : 'Précédent'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Suivant <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" disabled={loading} onClick={creer}>
            {loading && <Spinner />} Créer la copropriété
          </Button>
        )}
      </div>
    </div>
  );
}

function WCard({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Reca({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Pill({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-semibold nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
