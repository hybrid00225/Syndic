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
      <div className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-[#06120C]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(520px 420px at 75% 15%, rgba(16,185,129,.35), transparent 70%), radial-gradient(420px 320px at 10% 95%, rgba(5,150,105,.25), transparent 70%)',
          }}
        />
        <div className="relative">
          <Wordmark size="lg" onDark subtitle="Gestion de copropriété" />
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold leading-[1.1] tracking-tight text-white">
            Commencez avec Syndic Alpha.
          </h1>
          <p className="mt-3 max-w-sm text-emerald-100/70">
            La copropriété claire et juste au franc près — pensée pour
            l&apos;Afrique de l&apos;Ouest.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className={cn(
                  'rounded-xl border p-3.5',
                  s.n === 1
                    ? 'border-transparent bg-white text-neutral-900'
                    : 'border-white/10 bg-white/5 text-white/70',
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                    s.n === 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/10 text-white/70',
                  )}
                >
                  {s.n}
                </div>
                <p className="mt-2.5 text-sm font-medium leading-tight">
                  {s.title}
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs leading-tight',
                    s.n === 1 ? 'text-neutral-500' : 'text-white/45',
                  )}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm text-emerald-100/40">
          © {new Date().getFullYear()} Syndic Alpha
        </div>
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
