'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const PAYS = [
  ['CI', "Côte d'Ivoire"],
  ['BJ', 'Bénin'],
  ['BF', 'Burkina Faso'],
  ['GA', 'Gabon'],
  ['ML', 'Mali'],
  ['NE', 'Niger'],
  ['SN', 'Sénégal'],
  ['TG', 'Togo'],
];

const steps = [
  { n: 1, title: 'Créez votre compte', desc: 'Votre syndic en 2 minutes.' },
  { n: 2, title: 'Ajoutez vos copropriétés', desc: 'Lots, tantièmes, propriétaires.' },
  { n: 3, title: 'Appelez les fonds', desc: 'Encaissez et suivez les impayés.' },
];

const field =
  'h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/35 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/25';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-white/80';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPwd, setShowPwd] = useState(false);
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
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.motDePasse, remember);
      } else {
        await register(
          {
            syndicNom: form.syndicNom,
            pays: form.pays,
            nom: `${form.prenom} ${form.nom}`.trim(),
            email: form.email,
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

  return (
    <div className="grid min-h-screen bg-[#0A0F0C] lg:grid-cols-2">
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
            juste au franc près.
          </h1>
          <p className="mt-3 max-w-sm text-emerald-100/70">
            Lots, tantièmes, appels de fonds et recouvrement — maîtrisés,
            tracés, pensés pour l&apos;Afrique de l&apos;Ouest.
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
                <p className="nums text-[11px] text-emerald-300">
                  + 250 000 FCFA
                </p>
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
          « Enfin un suivi clair, au franc près. » — Gestionnaire, Abidjan
        </p>
      </div>

      {/* ---- Formulaire (droite) ---- */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark onDark />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h2>
          <p className="mt-1.5 text-sm text-white/50">
            {mode === 'login'
              ? 'Accédez à votre espace de gestion.'
              : 'Créez votre syndic et votre compte administrateur.'}
          </p>

          {/* Social */}
          <button
            type="button"
            onClick={bientot('La connexion Google sera bientôt disponible.')}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          {/* Séparateur */}
          <div className="my-5 flex items-center gap-3 text-xs text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            Ou
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className={labelCls}>Nom du syndic</label>
                  <input
                    required
                    className={field}
                    value={form.syndicNom}
                    onChange={(e) => set('syndicNom', e.target.value)}
                    placeholder="Ex. Prodestic Immobilier"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Prénom</label>
                    <input
                      required
                      className={field}
                      value={form.prenom}
                      onChange={(e) => set('prenom', e.target.value)}
                      placeholder="Awa"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nom</label>
                    <input
                      required
                      className={field}
                      value={form.nom}
                      onChange={(e) => set('nom', e.target.value)}
                      placeholder="Koné"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pays</label>
                  <select
                    className={cn(field, 'cursor-pointer')}
                    value={form.pays}
                    onChange={(e) => set('pays', e.target.value)}
                  >
                    {PAYS.map(([code, nom]) => (
                      <option key={code} value={code} className="text-neutral-900">
                        {nom}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className={field}
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="vous@exemple.ci"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Mot de passe</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={bientot(
                      'Pour réinitialiser votre mot de passe, contactez l’administrateur de votre syndic.',
                    )}
                    className="mb-1.5 text-[13px] font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  className={cn(field, 'pr-11')}
                  value={form.motDePasse}
                  onChange={(e) => set('motDePasse', e.target.value)}
                  placeholder="8 caractères minimum"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={
                    showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                  }
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-white/45 transition hover:bg-white/10 hover:text-white/80"
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {mode === 'register' && (
                <p className="mt-1.5 text-xs text-white/40">
                  Au moins 8 caractères.
                </p>
              )}
            </div>

            {mode === 'login' && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                <span
                  onClick={() => setRemember((v) => !v)}
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded border transition',
                    remember
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-white/20 bg-white/5',
                  )}
                >
                  {remember && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                Se souvenir de moi
              </label>
            )}

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-60"
            >
              {loading && <Spinner />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon espace'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setInfo(null);
              }}
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
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
