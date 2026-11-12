'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Field, Input, PasswordInput } from '@/components/ui/input';
import { SearchSelect } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Liste internationale (le produit n'est pas restreint à une région).
const PAYS = [
  ['CI', "Côte d'Ivoire"],
  ['SN', 'Sénégal'],
  ['CM', 'Cameroun'],
  ['GA', 'Gabon'],
  ['BJ', 'Bénin'],
  ['BF', 'Burkina Faso'],
  ['ML', 'Mali'],
  ['TG', 'Togo'],
  ['MA', 'Maroc'],
  ['TN', 'Tunisie'],
  ['FR', 'France'],
  ['BE', 'Belgique'],
  ['CH', 'Suisse'],
  ['CA', 'Canada'],
  ['Autre', 'Autre'],
] as const;

const steps = [
  { n: 1, title: 'Créez votre compte', desc: 'Votre syndic en 2 minutes.' },
  { n: 2, title: 'Ajoutez vos copropriétés', desc: 'Lots, tantièmes, propriétaires.' },
  { n: 3, title: 'Appelez les fonds', desc: 'Encaissez et suivez les impayés.' },
];

/** Même règle que l'API : 8 caractères minimum, au moins une lettre et un chiffre. */
function motDePasseValide(v: string) {
  return v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    motDePasse: '',
    prenom: '',
    nom: '',
    syndicNom: '',
    pays: 'CI',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Lien « Créer mon espace » de la page d'accueil : /login?mode=register.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'register') setMode('register');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'register' && !motDePasseValide(form.motDePasse)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.');
      return;
    }
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      if (mode === 'login') {
        await login(email, form.motDePasse, remember);
      } else {
        await register(
          {
            syndicNom: form.syndicNom.trim(),
            pays: form.pays,
            nom: `${form.prenom} ${form.nom}`.trim(),
            email,
            motDePasse: form.motDePasse,
          },
          remember,
        );
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const bientot = (msg: string) => () => {
    setError(null);
    setInfo(msg);
  };

  const basculer = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setInfo(null);
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* ---- Panneau marque (gauche) ---- */}
      <div className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-center xl:p-14">
        {/* Fonds : dégradé + halos + grille de points */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-[#06120C]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(560px 460px at 80% 8%, rgba(16,185,129,.38), transparent 70%), radial-gradient(460px 360px at 5% 100%, rgba(5,150,105,.28), transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,.07) 1px, transparent 0)',
            backgroundSize: '22px 22px',
            maskImage:
              'radial-gradient(70% 70% at 50% 40%, black, transparent)',
          }}
        />

        <Wordmark
          size="lg"
          onDark
          subtitle="Gestion de copropriété"
          className="absolute left-10 top-10 xl:left-14 xl:top-12"
        />

        {/* Bloc central équilibré */}
        <div className="relative max-w-lg">
          <h1 className="text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-white">
            La copropriété,
            <br />
            claire et maîtrisée.
          </h1>
          <p className="mt-3 max-w-sm text-emerald-100/70">
            Lots, tantièmes, appels de fonds et recouvrement — maîtrisés et
            tracés, depuis un seul endroit.
          </p>

          {/* Vignette produit flottante */}
          <div className="relative mt-9 max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-emerald-200/60">
                    Recouvrement · T1 2026
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    Résidence Les Palmiers
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  72 %
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-white/45">Encaissé</p>
                  <p className="nums text-sm font-semibold text-white">
                    8 900 000
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-white/45">Impayés</p>
                  <p className="nums text-sm font-semibold text-amber-300">
                    3 500 000
                  </p>
                </div>
              </div>
            </div>

            {/* petit toast flottant */}
            <div className="absolute -bottom-4 -right-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0C1512]/90 px-3 py-2 shadow-xl backdrop-blur">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-medium text-white">
                  Paiement reçu
                </p>
                <p className="nums text-[11px] text-emerald-300">+ 250 000</p>
              </div>
            </div>
          </div>

          {/* Étapes compactes */}
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2">
            {steps.map((s) => (
              <div key={s.n} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                    s.n === 1
                      ? 'bg-emerald-500 text-emerald-950'
                      : 'bg-white/10 text-white/60',
                  )}
                >
                  {s.n}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    s.n === 1 ? 'font-medium text-white' : 'text-white/55',
                  )}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="absolute bottom-10 left-10 text-sm text-emerald-100/40 xl:left-14">
          « Enfin un suivi clair et juste. » — Gestionnaire de copropriété
        </p>
      </div>

      {/* ---- Formulaire (droite) ---- */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>

          <h2 className="font-display text-3xl font-medium tracking-tight">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Accédez à votre espace de gestion.'
              : 'Créez votre syndic et votre compte administrateur.'}
          </p>

          <Button
            variant="secondary"
            size="lg"
            className="mt-6 w-full"
            onClick={bientot('La connexion Google sera bientôt disponible.')}
          >
            <GoogleIcon />
            Continuer avec Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-2xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <Field label="Nom du syndic" required>
                  <Input
                    required
                    maxLength={120}
                    autoComplete="organization"
                    value={form.syndicNom}
                    onChange={(e) => set('syndicNom', e.target.value)}
                    placeholder="Ex. Résidences Horizon Gestion"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom" required>
                    <Input
                      required
                      maxLength={80}
                      autoComplete="given-name"
                      value={form.prenom}
                      onChange={(e) => set('prenom', e.target.value)}
                      placeholder="Awa"
                    />
                  </Field>
                  <Field label="Nom" required>
                    <Input
                      required
                      maxLength={80}
                      autoComplete="family-name"
                      value={form.nom}
                      onChange={(e) => set('nom', e.target.value)}
                      placeholder="Koné"
                    />
                  </Field>
                </div>
                <Field label="Pays">
                  <CountrySelect value={form.pays} onChange={(v) => set('pays', v)} options={PAYS} />
                </Field>
              </>
            )}

            <Field label="Email" required>
              <Input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="vous@exemple.ci"
              />
            </Field>

            <Field
              label="Mot de passe"
              required
              hint={mode === 'register' ? 'Au moins 8 caractères, dont une lettre et un chiffre.' : undefined}
              action={
                mode === 'login' ? (
                  <Button
                    variant="link"
                    className="text-ui"
                    onClick={bientot(
                      'Pour réinitialiser votre mot de passe, contactez l’administrateur de votre syndic.',
                    )}
                  >
                    Mot de passe oublié ?
                  </Button>
                ) : undefined
              }
            >
              <PasswordInput
                required
                minLength={8}
                maxLength={128}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={form.motDePasse}
                onChange={(e) => set('motDePasse', e.target.value)}
                placeholder="8 caractères minimum"
              />
            </Field>

            {mode === 'login' && (
              <Checkbox
                label="Se souvenir de moi"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
            )}

            {error && <Alert tone="danger">{error}</Alert>}
            {info && <Alert tone="info">{info}</Alert>}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Spinner />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon espace'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <Button variant="link" className="font-semibold" onClick={basculer}>
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </Button>
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.2 5.2C41.9 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
