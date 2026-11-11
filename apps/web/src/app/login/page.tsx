'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(600px 300px at 20% 20%, rgba(255,255,255,.35), transparent), radial-gradient(500px 400px at 90% 90%, rgba(0,0,0,.25), transparent)',
          }}
        />
        <div className="relative flex items-center gap-2 text-primary-foreground">
          <Building2 className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">
            Syndic Alpha
          </span>
        </div>
        <div className="relative text-primary-foreground">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            La gestion de copropriété, enfin claire et juste au franc près.
          </h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Lots, tantièmes, appels de fonds, encaissements et impayés —
            maîtrisés, tracés, pensés pour l&apos;Afrique de l&apos;Ouest.
          </p>
        </div>
        <div className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Syndic Alpha
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Syndic Alpha</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {mode === 'login' ? 'Bon retour' : 'Créer votre espace'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Connectez-vous pour accéder à votre tableau de bord.'
              : 'Créez votre syndic et votre compte administrateur.'}
          </p>

          {/* Onglets */}
          <div className="mt-6 inline-flex rounded-lg bg-muted p-1 text-sm">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  'rounded-md px-4 py-1.5 font-medium transition-colors',
                  mode === m
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
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
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Spinner />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon espace'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
