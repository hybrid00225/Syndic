'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/wordmark';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    motDePasse: '',
    nom: '',
    syndicNom: '',
    pays: 'CI',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.motDePasse);
      } else {
        await register({
          syndicNom: form.syndicNom,
          pays: form.pays,
          nom: form.nom,
          email: form.email,
          motDePasse: form.motDePasse,
        });
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* halos verts discrets */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(600px 320px at 85% -5%, hsl(var(--primary) / 0.10), transparent 70%), radial-gradient(500px 400px at 5% 110%, hsl(var(--primary) / 0.07), transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Wordmark size="lg" subtitle="Gestion de copropriété" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-lift">
          <h1 className="text-xl font-semibold tracking-tight">
            {mode === 'login' ? 'Accès à votre espace' : 'Créer votre syndic'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Connectez-vous pour gérer vos copropriétés.'
              : 'Créez votre syndic et votre compte administrateur.'}
          </p>

          {/* onglets soulignés */}
          <div className="mt-5 flex gap-6 border-b border-border">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors',
                  mode === m
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <Label>Nom du syndic</Label>
                  <Input
                    required
                    value={form.syndicNom}
                    onChange={(e) => set('syndicNom', e.target.value)}
                    placeholder="Ex. Prodestic Immobilier"
                  />
                </div>
                <div>
                  <Label>Votre nom</Label>
                  <Input
                    required
                    value={form.nom}
                    onChange={(e) => set('nom', e.target.value)}
                    placeholder="Ex. Awa Koné"
                  />
                </div>
              </>
            )}
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="vous@exemple.ci"
              />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={form.motDePasse}
                onChange={(e) => set('motDePasse', e.target.value)}
                placeholder="8 caractères minimum"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Spinner />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon espace'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Syndic Alpha · Afrique de l&apos;Ouest
        </p>
      </div>
    </div>
  );
}
