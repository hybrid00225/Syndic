'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  CheckCircle2,
  Clock,
  Globe2,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate, STATUT_COPRO } from '@/lib/utils';

interface Copropriete {
  id: string;
  nom: string;
  pays: string;
  adresse: string | null;
  statut: string;
  dateCreation: string;
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
  const pays = new Set(copros.map((c) => c.pays)).size;

  return (
    <div className="animate-fade-up space-y-7">
      <div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>Espace</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Tableau de bord</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Bonjour {user?.nom?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {copros.length} copropriété{copros.length > 1 ? 's' : ''} ·{' '}
          {actives} active{actives > 1 ? 's' : ''} dans votre portefeuille.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Copropriétés"
          value={copros.length}
          icon={Home}
          iconClass="bg-primary/10 text-primary"
          hint="au total"
        />
        <StatTile
          label="Actives"
          value={actives}
          icon={CheckCircle2}
          iconClass="bg-success/12 text-success"
          trend={{ value: 'En exploitation', tone: 'success' }}
        />
        <StatTile
          label="En création"
          value={enCreation}
          icon={Clock}
          iconClass="bg-warning/15 text-warning"
          hint="à finaliser"
        />
        <StatTile
          label="Pays"
          value={pays}
          icon={Globe2}
          iconClass="bg-info/12 text-info"
          hint="juridictions"
        />
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
            <CardContent className="py-14 text-center">
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
          <div className="grid gap-3 sm:grid-cols-2">
            {copros.slice(0, 6).map((c) => (
              <Card key={c.id} className="p-4 transition-shadow hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{c.nom}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {c.adresse ?? c.pays}
                      </p>
                    </div>
                  </div>
                  <Badge tone={statutTone[c.statut] ?? 'neutral'} dot>
                    {STATUT_COPRO[c.statut] ?? c.statut}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>{c.pays}</span>
                  <span>·</span>
                  <span>Créée le {formatDate(c.dateCreation)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
