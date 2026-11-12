'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field, Label } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { CountryLabel, CountrySelect } from '@/components/ui/country';
import { Spinner } from '@/components/ui/spinner';
import { IconButton } from '@/components/ui/icon-button';
import { Segmented } from '@/components/ui/segmented';
import { FormError } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
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

const STEPS = ['Informations', 'Structure', 'Lots', 'Récapitulatif'];

// Codes auto-générés, lisibles et modifiables (règle : on amorce, l'utilisateur ajuste).
const lettre = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `B${i + 1}`);
const niveauNom = (i: number) => (i === 0 ? 'RDC' : `R+${i}`);
const pad = (n: number, l = 2) => String(n).padStart(l, '0');

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

  // Générateur rapide : certaines copropriétés n'ont pas de bâtiments.
  const [avecBatiments, setAvecBatiments] = useState(false);
  const [gen, setGen] = useState({ nbBat: '2', nbNiv: '3', nbLot: '4' });

  const setC = (k: string, v: string) => setCopro((f) => ({ ...f, [k]: v }));
  const setG = (k: keyof typeof gen, v: string) =>
    setGen((g) => ({ ...g, [k]: v.replace(/[^0-9]/g, '') }));

  // -- Génération en masse ---------------------------------------------------
  const genererStructure = () => {
    const nbLot = Math.max(0, Number(gen.nbLot) || 0);
    if (!avecBatiments) {
      setBatiments([]);
      setLots(
        Array.from({ length: nbLot }, (_, i) => ({
          reference: `L${pad(i + 1, 3)}`,
          type: 'APPARTEMENT',
          superficie: '',
          statut: 'VACANT',
          batimentIndex: '',
          niveauIndex: '',
        })),
      );
      return;
    }
    const nbBat = Math.max(1, Number(gen.nbBat) || 1);
    const nbNiv = Math.max(1, Number(gen.nbNiv) || 1);
    const nextBat: BatimentW[] = Array.from({ length: nbBat }, (_, bi) => ({
      nom: `Bâtiment ${lettre(bi)}`,
      niveaux: Array.from({ length: nbNiv }, (_, ni) => ({ nom: niveauNom(ni) })),
    }));
    const nextLots: LotW[] = [];
    for (let bi = 0; bi < nbBat; bi++) {
      for (let ni = 0; ni < nbNiv; ni++) {
        for (let li = 0; li < nbLot; li++) {
          nextLots.push({
            reference: `${lettre(bi)}${ni}${pad(li + 1)}`,
            type: 'APPARTEMENT',
            superficie: '',
            statut: 'VACANT',
            batimentIndex: String(bi),
            niveauIndex: String(ni),
          });
        }
      }
    }
    setBatiments(nextBat);
    setLots(nextLots);
  };

  // -- Édition manuelle ------------------------------------------------------
  const addBatiment = () => setBatiments((b) => [...b, { nom: '', niveaux: [] }]);
  const setBatNom = (i: number, v: string) =>
    setBatiments((b) => b.map((x, idx) => (idx === i ? { ...x, nom: v } : x)));
  const removeBatiment = (i: number) => {
    setBatiments((b) => b.filter((_, idx) => idx !== i));
    // Détache les lots du bâtiment supprimé pour éviter des index orphelins.
    setLots((l) =>
      l.map((x) =>
        x.batimentIndex === String(i)
          ? { ...x, batimentIndex: '', niveauIndex: '' }
          : x,
      ),
    );
  };
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
      {
        reference: '',
        type: 'APPARTEMENT',
        superficie: '',
        statut: 'VACANT',
        batimentIndex: '',
        niveauIndex: '',
      },
    ]);
  const setLot = (i: number, k: keyof LotW, v: string) =>
    setLots((l) => l.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const removeLot = (i: number) => setLots((l) => l.filter((_, idx) => idx !== i));

  const canNext = step === 0 ? !!(copro.nom.trim() && copro.pays) : true;

  const nbBatValides = batiments.filter((b) => b.nom.trim()).length;
  const nbNivValides = batiments.reduce(
    (s, b) => s + b.niveaux.filter((n) => n.nom.trim()).length,
    0,
  );
  const nbLotsValides = lots.filter((l) => l.reference.trim()).length;

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
    <div className="space-y-6">
      <Stepper step={step} onGo={(i) => i < step && setStep(i)} />

      {/* Étape 1 — Informations */}
      {step === 0 && (
        <div className="space-y-5">
          <Section title="Identité" hint="Qui est cette copropriété et comment la désigner.">
            <Field className="sm:col-span-2" label="Nom de la copropriété" required hint="Nom affiché partout : relevés, appels de fonds, convocations.">
              <Input autoFocus value={copro.nom} onChange={(e) => setC('nom', e.target.value)} placeholder="Ex. Résidence Les Palmiers" />
            </Field>
            <Field label="Référence" hint="Code interne court, facultatif.">
              <Input value={copro.reference} onChange={(e) => setC('reference', e.target.value)} placeholder="COP-001" />
            </Field>
            <Field label="Type" hint="Usage dominant des lots.">
              <SearchSelect value={copro.type} onChange={(v) => setC('type', v)} options={TYPES_COPRO} />
            </Field>
          </Section>

          <Section title="Localisation" hint="Sert aux documents et aux correspondances.">
            <Field label="Pays" required hint="Cadre par défaut — aucune restriction de marché.">
              <CountrySelect value={copro.pays} onChange={(v) => setC('pays', v)} />
            </Field>
            <Field label="Ensemble immobilier" hint="Si la copropriété fait partie d'un ensemble plus vaste.">
              <Input value={copro.ensembleImmobilier} onChange={(e) => setC('ensembleImmobilier', e.target.value)} placeholder="Cité des Palmiers" />
            </Field>
            <Field className="sm:col-span-2" label="Adresse">
              <Input value={copro.adresse} onChange={(e) => setC('adresse', e.target.value)} placeholder="Quartier, ville" />
            </Field>
          </Section>

          <Section title="Paramètres & administration" hint="Devise, gestion et règle de répartition des charges.">
            <Field label="Devise" hint="Toutes les sommes de cette copropriété s'expriment dans cette devise.">
              <SearchSelect value={copro.devise} onChange={(v) => setC('devise', v)} options={DEVISES} />
            </Field>
            <Field label="Administration" hint="Syndic professionnel ou bénévole.">
              <SearchSelect value={copro.natureSyndic} onChange={(v) => setC('natureSyndic', v)} options={NATURE_SYNDIC} />
            </Field>
            <Field
              className="sm:col-span-2"
              label="Mode de répartition des charges"
              hint="Détermine comment les charges sont ventilées entre les lots. Une clé « Charges générales » est créée automatiquement (sauf en Montant fixe), avec des tantièmes initiaux basés sur la superficie des lots — ajustables ensuite dans l'onglet Répartition."
            >
              <SearchSelect value={copro.modeRepartition} onChange={(v) => setC('modeRepartition', v)} options={MODES_REPARTITION} />
            </Field>
            <Field label="Date de mise en exploitation" hint="Date d'effet initiale des tantièmes.">
              <Input type="date" value={copro.dateMiseExploitation} onChange={(e) => setC('dateMiseExploitation', e.target.value)} />
            </Field>
          </Section>

          <Section title="Description">
            <Field className="sm:col-span-2" label="Notes" hint="Informations libres (facultatif).">
              <Textarea value={copro.description} onChange={(e) => setC('description', e.target.value)} rows={2} placeholder="Notes…" />
            </Field>
          </Section>
        </div>
      )}

      {/* Étape 2 — Structure (générateur + édition) */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-muted/40 p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <h2 className="text-ui font-semibold">Génération rapide</h2>
            </div>
            <p className="mt-1.5 text-2xs text-muted-foreground">
              Indiquez des quantités : nous créons les bâtiments, niveaux et lots avec des codes
              (A001, A002…). <strong className="font-medium text-foreground">Tout reste modifiable</strong> juste en dessous.
            </p>

            {/* Avec ou sans bâtiments */}
            <div className="mt-4">
              <Label>Cette copropriété comporte-t-elle des bâtiments&nbsp;?</Label>
              <Segmented
                className="mt-1.5"
                aria-label="Bâtiments"
                value={avecBatiments ? 'avec' : 'sans'}
                onChange={(v) => setAvecBatiments(v === 'avec')}
                options={[
                  ['sans', 'Sans bâtiment'],
                  ['avec', 'Avec bâtiments'],
                ]}
              />
              <p className="mt-1.5 text-2xs text-muted-foreground">
                {avecBatiments
                  ? 'Les lots seront répartis par bâtiment et par niveau.'
                  : 'Les lots seront créés directement, sans bâtiment ni niveau.'}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {avecBatiments && (
                <>
                  <Field label="Nombre de bâtiments" hint="Codés A, B, C…">
                    <Input inputMode="numeric" value={gen.nbBat} onChange={(e) => setG('nbBat', e.target.value)} placeholder="Ex. 2" />
                  </Field>
                  <Field label="Niveaux par bâtiment" hint="RDC, R+1, R+2…">
                    <Input inputMode="numeric" value={gen.nbNiv} onChange={(e) => setG('nbNiv', e.target.value)} placeholder="Ex. 5" />
                  </Field>
                </>
              )}
              <Field label={avecBatiments ? 'Lots par niveau' : 'Nombre de lots'} hint="Type par défaut : appartement.">
                <Input inputMode="numeric" value={gen.nbLot} onChange={(e) => setG('nbLot', e.target.value)} placeholder="Ex. 4" />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button type="button" onClick={genererStructure}>
                <Wand2 className="h-4 w-4" /> Générer la structure
              </Button>
              {(batiments.length > 0 || lots.length > 0) && (
                <span className="text-2xs text-muted-foreground">
                  {nbBatValides} bâtiment{nbBatValides > 1 ? 's' : ''} · {nbNivValides} niveau
                  {nbNivValides > 1 ? 'x' : ''} · {nbLotsValides} lot{nbLotsValides > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Bâtiments & niveaux (édition) */}
          {avecBatiments && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-ui font-semibold">Bâtiments &amp; niveaux</h2>
                  <p className="text-2xs text-muted-foreground">Renommez librement ; ajoutez ou retirez des niveaux.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addBatiment}>
                  <Plus className="h-4 w-4" /> Bâtiment
                </Button>
              </div>
              {batiments.length === 0 ? (
                <Hint className="mt-4">Aucun bâtiment pour l'instant. Générez-les ci-dessus ou ajoutez-les un par un.</Hint>
              ) : (
                <div className="mt-4 space-y-3">
                  {batiments.map((b, bi) => (
                    <div key={bi} className="rounded-md border border-border p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-semibold text-muted-foreground">{lettre(bi)}</span>
                        <Input value={b.nom} onChange={(e) => setBatNom(bi, e.target.value)} placeholder={`Bâtiment ${lettre(bi)}`} className="flex-1" />
                        <Button type="button" variant="ghost" size="sm" onClick={() => addNiveau(bi)}>
                          <Plus className="h-4 w-4" /> Niveau
                        </Button>
                        <IconButton label="Supprimer le bâtiment" icon={Trash2} tone="danger" className="h-10 w-10" onClick={() => removeBatiment(bi)} />
                      </div>
                      {b.niveaux.length > 0 && (
                        <div className="mt-2.5 space-y-2 border-l border-border pl-4">
                          {b.niveaux.map((n, ni) => (
                            <div key={ni} className="flex items-center gap-2">
                              <Input value={n.nom} onChange={(e) => setNivNom(bi, ni, e.target.value)} placeholder={niveauNom(ni)} className="flex-1" />
                              <IconButton label="Supprimer le niveau" icon={Trash2} tone="danger" className="h-10 w-10" onClick={() => removeNiveau(bi, ni)} />
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
        </div>
      )}

      {/* Étape 3 — Lots */}
      {step === 2 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-ui font-semibold">Lots</h2>
              <p className="text-2xs text-muted-foreground">
                {nbLotsValides > 0
                  ? `${nbLotsValides} lot${nbLotsValides > 1 ? 's' : ''}. Ajustez références, types et superficies.`
                  : 'Aucun lot : générez-les à l’étape précédente ou ajoutez-les ici.'}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addLot}>
              <Plus className="h-4 w-4" /> Lot
            </Button>
          </div>
          {lots.length > 0 && (
            <div className="mt-4 space-y-2.5">
              {lots.map((l, i) => {
                const niveauxOptions =
                  l.batimentIndex !== '' && batiments[Number(l.batimentIndex)]
                    ? batiments[Number(l.batimentIndex)].niveaux.map(
                        (n, ni) => [String(ni), n.nom || niveauNom(ni)] as const,
                      )
                    : [];
                return (
                  <div key={i} className="grid items-center gap-2 rounded-md border border-border p-2.5 sm:grid-cols-2 lg:grid-cols-12">
                    <Input className="lg:col-span-2" value={l.reference} onChange={(e) => setLot(i, 'reference', e.target.value)} placeholder="Réf. (A101)" />
                    <SearchSelect className="lg:col-span-2" value={l.type} onChange={(v) => setLot(i, 'type', v)} options={LOT_TYPES} />
                    <Input className="lg:col-span-2" type="number" min={0} value={l.superficie} onChange={(e) => setLot(i, 'superficie', e.target.value)} placeholder="m²" />
                    <SearchSelect className="lg:col-span-2" value={l.statut} onChange={(v) => setLot(i, 'statut', v)} options={LOT_STATUTS} />
                    <SearchSelect
                      className="lg:col-span-2"
                      value={l.batimentIndex}
                      onChange={(v) => {
                        setLot(i, 'batimentIndex', v);
                        setLot(i, 'niveauIndex', '');
                      }}
                      options={batiments.map((b, bi) => [String(bi), b.nom || `Bâtiment ${lettre(bi)}`] as const)}
                      allowEmpty
                      emptyLabel="Sans bâtiment"
                    />
                    <div className="flex items-center gap-2 lg:col-span-2">
                      <SearchSelect
                        className="flex-1"
                        value={l.niveauIndex}
                        onChange={(v) => setLot(i, 'niveauIndex', v)}
                        options={niveauxOptions}
                        allowEmpty
                        emptyLabel="Sans niveau"
                        disabled={l.batimentIndex === ''}
                      />
                      <IconButton label="Supprimer le lot" icon={Trash2} tone="danger" className="h-10 w-10" onClick={() => removeLot(i)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Étape 4 — Récapitulatif */}
      {step === 3 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-ui font-semibold">Récapitulatif</h2>
          <dl className="mt-4 grid gap-x-10 gap-y-0 text-ui sm:grid-cols-2">
            <Reca label="Nom" value={copro.nom || '—'} />
            <Reca label="Type" value={TYPES_COPRO.find((t) => t[0] === copro.type)?.[1] ?? copro.type} />
            <Reca label="Pays" value={<CountryLabel code={copro.pays} />} />
            <Reca label="Devise" value={copro.devise} />
            <Reca label="Répartition" value={MODES_REPARTITION.find((m) => m[0] === copro.modeRepartition)?.[1] ?? copro.modeRepartition} />
            <Reca label="Administration" value={NATURE_SYNDIC.find((n) => n[0] === copro.natureSyndic)?.[1] ?? copro.natureSyndic} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-6 border-t border-border pt-4 text-ui">
            <Tally label="Bâtiments" value={nbBatValides} />
            <Tally label="Niveaux" value={nbNivValides} />
            <Tally label="Lots" value={nbLotsValides} />
          </div>
          {copro.modeRepartition !== 'MONTANT_FIXE' && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-2xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Une clé « Charges générales » sera créée avec des tantièmes initiaux. Vous pourrez
                lancer un appel de fonds dès la création.
              </span>
            </div>
          )}
          <FormError error={error} className="mt-4" />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-5">
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

// -- Sous-composants ---------------------------------------------------------

function Stepper({ step, onGo }: { step: number; onGo: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto border-b border-border pb-px">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={s}>
            <button
              type="button"
              onClick={() => onGo(i)}
              disabled={i > step}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-ui transition-colors',
                active
                  ? 'border-primary font-semibold text-foreground'
                  : 'border-transparent text-muted-foreground',
                done && 'hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                  done
                    ? 'bg-primary text-primary-foreground'
                    : active
                      ? 'border border-primary text-primary'
                      : 'border border-border text-muted-foreground',
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-ui font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-2xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-ui text-muted-foreground', className)}>{children}</p>;
}

function Reca({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
