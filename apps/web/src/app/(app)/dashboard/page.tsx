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
  Plus,
  ReceiptText,
  Wallet,
  Check,
  Circle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ledger, Stat, Composition, Ring } from '@/components/ui/stat';
import { Tooltip } from '@/components/ui/tooltip';
import { CountryFlag, CountryLabel } from '@/components/ui/country';
import { nomPays } from '@/lib/constants';
import { PageLoader } from '@/components/ui/spinner';
import { formatDate, STATUT_COPRO } from '@/lib/utils';
import { cn } from '@/lib/utils';

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

      {/* KPI */}
      <Ledger>
        <Stat
          lead
          label="Copropriétés"
          value={copros.length}
          info="Toutes les copropriétés de votre portefeuille, par statut."
          viz={
            <Composition
              segments={[
                { label: 'Actives', value: actives, tone: 'ink' },
                { label: 'En création', value: enCreation, tone: 'warn' },
                { label: 'Hors exploitation', value: copros.length - actives - enCreation, tone: 'soft' },
              ]}
            />
          }
        />
        <Stat
          label="En exploitation"
          value={actives}
          unit={`/ ${copros.length}`}
          info="Copropriétés au statut « Active »."
          aside={<Ring value={copros.length ? actives / copros.length : 0} />}
          note="part du portefeuille"
        />
        <Stat
          label="À finaliser"
          value={enCreation}
          tone={enCreation > 0 ? 'warning' : 'default'}
          info="Copropriétés « En création » : à compléter avant le premier appel de fonds."
          note={enCreation > 0 ? 'fiche ou patrimoine incomplet' : 'rien en attente'}
        />
        <Stat
          label="Pays"
          value={pays}
          info="Pays (juridictions) où se situent vos copropriétés."
          aside={
            <span className="flex max-w-[60%] flex-wrap justify-end gap-1.5">
              {[...new Set(copros.map((c) => c.pays))].map((code) => (
                <Tooltip key={code} label={nomPays(code)}>
                  <span tabIndex={0} className="rounded-[2px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <CountryFlag code={code} />
                  </span>
                </Tooltip>
              ))}
            </span>
          }
          note="juridictions"
        />
      </Ledger>

      {/* Contenu principal + rail */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Principal */}
        <div className="lg:col-span-2">
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
            <Card className="flex flex-col items-center py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Home className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium">Aucune copropriété</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Créez votre première copropriété pour commencer.
              </p>
              <Link
                href="/coproprietes"
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Nouvelle copropriété
              </Link>
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
                          {c.adresse ?? 'Adresse non renseignée'}
                        </p>
                      </div>
                    </div>
                    <Badge tone={statutTone[c.statut] ?? 'neutral'} dot>
                      {STATUT_COPRO[c.statut] ?? c.statut}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <CountryLabel code={c.pays} className="font-medium text-foreground" />
                    <span>·</span>
                    <span>Créée le {formatDate(c.dateCreation)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rail latéral */}
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Raccourcis</h3>
            <div className="mt-3 space-y-2">
              <Link
                href="/coproprietes"
                className="flex h-11 items-center gap-2.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Nouvelle copropriété
              </Link>
              <Link
                href="/appels"
                className="flex h-11 items-center gap-2.5 rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-muted"
              >
                <ReceiptText className="h-4 w-4 text-muted-foreground" /> Générer
                un appel de fonds
              </Link>
              <Link
                href="/impayes"
                className="flex h-11 items-center gap-2.5 rounded-lg border border-border px-3.5 text-sm font-medium transition hover:bg-muted"
              >
                <Wallet className="h-4 w-4 text-muted-foreground" /> Suivre les
                impayés
              </Link>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold">Pour bien démarrer</h3>
            <ul className="mt-3 space-y-3">
              {[
                { label: 'Créer une copropriété', done: copros.length > 0 },
                { label: 'Ajouter des bâtiments et des lots', done: false },
                { label: 'Définir les tantièmes', done: false },
                { label: 'Générer un premier appel de fonds', done: false },
              ].map((step) => (
                <li key={step.label} className="flex items-center gap-2.5 text-sm">
                  {step.done ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      step.done && 'text-muted-foreground line-through',
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
