'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';

interface Copropriete {
  id: string;
  nom: string;
  pays: string;
  statut: string;
}

const statutTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  EN_CREATION: 'warning',
  INACTIVE: 'neutral',
  CLOTUREE: 'neutral',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [copros, setCopros] = useState<Copropriete[] | null>(null);

  useEffect(() => {
    api<Copropriete[]>('/coproprietes').then(setCopros).catch(() => setCopros([]));
  }, []);

  if (!copros) return <PageLoader />;

  const actives = copros.filter((c) => c.statut === 'ACTIVE').length;
  const enCreation = copros.filter((c) => c.statut === 'EN_CREATION').length;

  const tiles = [
    {
      label: 'Copropriétés',
      value: copros.length,
      icon: Home,
      classes: 'bg-primary/10 text-primary',
    },
    {
      label: 'Actives',
      value: actives,
      icon: CheckCircle2,
      classes: 'bg-success/10 text-success',
    },
    {
      label: 'En création',
      value: enCreation,
      icon: Clock,
      classes: 'bg-warning/15 text-warning',
    },
  ];

  return (
    <div className="animate-fade-up space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {user?.nom?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Voici un aperçu de votre portefeuille.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label}>
              <CardContent className="flex items-center gap-4 pt-5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${t.classes}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {t.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Copropriétés récentes
          </h2>
          <Link
            href="/coproprietes"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tout voir <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {copros.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Aucune copropriété pour l&apos;instant.
              </p>
              <Link
                href="/coproprietes"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Créer la première →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {copros.slice(0, 5).map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{c.nom}</p>
                    <p className="text-sm text-muted-foreground">{c.pays}</p>
                  </div>
                  <Badge tone={statutTone[c.statut] ?? 'neutral'}>
                    {c.statut.toLowerCase().replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
