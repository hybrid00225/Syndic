'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Home,
  CheckCircle2,
  Clock,
  Globe2,
  Search,
  Eye,
  Pencil,
  Archive,
  Table as TableIcon,
  LayoutGrid,
  Printer,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Coins,
  CalendarDays,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { PageHeader } from '@/components/page-header';
import { formatDate, STATUT_COPRO, cn } from '@/lib/utils';
import { PAYS, STATUTS_COPRO } from '@/lib/constants';

interface Copropriete {
  id: string;
  nom: string;
  pays: string;
  adresse: string | null;
  devise: string;
  statut: string;
  dateCreation: string;
}

const statutTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  EN_CREATION: 'warning',
  INACTIVE: 'neutral',
  CLOTUREE: 'neutral',
};

const selectCls =
  'h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25';

const PAGE_SIZE = 8;

export default function CoproprietesPage() {
  const confirm = useConfirm();
  const [copros, setCopros] = useState<Copropriete[] | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('');
  const [pays, setPays] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);

  const charger = () =>
    api<Copropriete[]>('/coproprietes').then(setCopros).catch(() => setCopros([]));
  useEffect(() => {
    charger();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [q, statut, pays, sort]);

  const filtered = useMemo(() => {
    if (!copros) return [];
    const needle = q.trim().toLowerCase();
    const res = copros.filter(
      (c) =>
        (!needle ||
          c.nom.toLowerCase().includes(needle) ||
          (c.adresse ?? '').toLowerCase().includes(needle)) &&
        (!statut || c.statut === statut) &&
        (!pays || c.pays === pays),
    );
    res.sort((a, b) => {
      if (sort === 'nom') return a.nom.localeCompare(b.nom);
      if (sort === 'nom-desc') return b.nom.localeCompare(a.nom);
      const da = +new Date(a.dateCreation);
      const db = +new Date(b.dateCreation);
      return sort === 'ancien' ? da - db : db - da;
    });
    return res;
  }, [copros, q, statut, pays, sort]);

  if (!copros) return <PageLoader />;

  const actives = copros.filter((c) => c.statut === 'ACTIVE').length;
  const enCreation = copros.filter((c) => c.statut === 'EN_CREATION').length;
  const nbPays = new Set(copros.map((c) => c.pays)).size;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = q || statut || pays || sort !== 'recent';

  const reset = () => {
    setQ('');
    setStatut('');
    setPays('');
    setSort('recent');
  };

  const exporter = () => {
    const header = ['Nom', 'Adresse', 'Pays', 'Devise', 'Statut', 'Créée le'];
    const rows = filtered.map((c) => [
      c.nom,
      c.adresse ?? '',
      c.pays,
      c.devise,
      STATUT_COPRO[c.statut] ?? c.statut,
      formatDate(c.dateCreation),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coproprietes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const archiver = async (c: Copropriete) => {
    const ok = await confirm({
      title: `Archiver « ${c.nom} » ?`,
      description:
        'La copropriété passera au statut « Clôturée ». Son historique (lots, appels de fonds, paiements) est intégralement conservé.',
      nextAction:
        'Elle quittera les listes actives ; vous pourrez la rouvrir en modifiant son statut.',
      confirmLabel: 'Archiver',
      tone: 'danger',
    });
    if (!ok) return;
    await api(`/coproprietes/${c.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut: 'CLOTUREE' }),
    });
    charger();
  };

  const Actions = ({ c }: { c: Copropriete }) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip label="Voir le détail">
        <Link
          href={`/coproprietes/${c.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </Tooltip>
      <Tooltip label="Modifier">
        <Link
          href={`/coproprietes/${c.id}/modifier`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      </Tooltip>
      <Tooltip label="Archiver">
        <button
          onClick={() => archiver(c)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
        >
          <Archive className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Copropriétés' }]}
        title="Copropriétés"
        subtitle={`${copros.length} copropriété${copros.length > 1 ? 's' : ''} au total.`}
        actions={
          <>
            <Tooltip label="Imprimer la liste" side="bottom">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimer
              </Button>
            </Tooltip>
            <Tooltip label="Exporter en CSV" side="bottom">
              <Button variant="secondary" size="sm" onClick={exporter}>
                <Download className="h-4 w-4" /> Exporter
              </Button>
            </Tooltip>
            <Button asChild size="sm">
              <Link href="/coproprietes/nouvelle">
                <Plus className="h-4 w-4" /> Nouvelle copropriété
              </Link>
            </Button>
          </>
        }
      />

      {/* Widgets cliquables (filtrent la liste) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Copropriétés"
          value={copros.length}
          icon={Home}
          filled
          onClick={() => setStatut('')}
        />
        <StatTile
          label="Actives"
          value={actives}
          icon={CheckCircle2}
          tone="success"
          onClick={() => setStatut('ACTIVE')}
          active={statut === 'ACTIVE'}
        />
        <StatTile
          label="En création"
          value={enCreation}
          icon={Clock}
          tone="warning"
          onClick={() => setStatut('EN_CREATION')}
          active={statut === 'EN_CREATION'}
        />
        <StatTile label="Pays" value={nbPays} icon={Globe2} tone="info" hint="juridictions" />
      </div>

      {/* Filtre avancé */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom ou adresse…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>
          <select className={selectCls} value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {STATUTS_COPRO.map(([c, l]) => (
              <option key={c} value={c}>
                {l}
              </option>
            ))}
          </select>
          <select className={selectCls} value={pays} onChange={(e) => setPays(e.target.value)}>
            <option value="">Tous les pays</option>
            {PAYS.map(([c, l]) => (
              <option key={c} value={c}>
                {l}
              </option>
            ))}
          </select>
          <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Plus récentes</option>
            <option value="ancien">Plus anciennes</option>
            <option value="nom">Nom (A→Z)</option>
            <option value="nom-desc">Nom (Z→A)</option>
          </select>
          {hasFilters && (
            <Tooltip label="Réinitialiser les filtres" side="bottom">
              <button
                onClick={reset}
                className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" /> Réinitialiser
              </button>
            </Tooltip>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <Tooltip label="Vue tableau" side="bottom">
                <button
                  onClick={() => setView('table')}
                  aria-label="Vue tableau"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition',
                    view === 'table'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="Vue cartes" side="bottom">
                <button
                  onClick={() => setView('cards')}
                  aria-label="Vue cartes"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition',
                    view === 'cards'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </Card>

      {/* Résultats */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Home className="h-6 w-6" />
          </div>
          <p className="mt-3 font-medium">Aucune copropriété</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copros.length === 0
              ? 'Créez votre première copropriété pour commencer.'
              : 'Aucun résultat pour ces filtres.'}
          </p>
          {copros.length === 0 ? (
            <Button asChild className="mt-4">
              <Link href="/coproprietes/nouvelle">
                <Plus className="h-4 w-4" /> Nouvelle copropriété
              </Link>
            </Button>
          ) : (
            <Button variant="secondary" className="mt-4" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Réinitialiser les filtres
            </Button>
          )}
        </Card>
      ) : view === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="border border-border px-4 py-3 font-semibold">Nom</th>
                <th className="border border-border px-4 py-3 font-semibold">Adresse</th>
                <th className="border border-border px-4 py-3 font-semibold">Pays</th>
                <th className="border border-border px-4 py-3 font-semibold">Devise</th>
                <th className="border border-border px-4 py-3 font-semibold">Statut</th>
                <th className="border border-border px-4 py-3 font-semibold">Créée le</th>
                <th className="border border-border px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((c) => (
                <tr key={c.id} className="bg-card transition-colors hover:bg-muted/50">
                  <td className="border border-border px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Home className="h-4 w-4" />
                      </span>
                      <Link
                        href={`/coproprietes/${c.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {c.nom}
                      </Link>
                    </div>
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    {c.adresse ?? '—'}
                  </td>
                  <td className="border border-border px-4 py-3">{c.pays}</td>
                  <td className="border border-border px-4 py-3">{c.devise}</td>
                  <td className="border border-border px-4 py-3">
                    <Badge tone={statutTone[c.statut] ?? 'neutral'} dot>
                      {STATUT_COPRO[c.statut] ?? c.statut}
                    </Badge>
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    {formatDate(c.dateCreation)}
                  </td>
                  <td className="border border-border px-4 py-3">
                    <Actions c={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((c) => (
            <Card key={c.id} className="flex flex-col p-4 transition-shadow hover:shadow-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Home className="h-5 w-5" />
                  </span>
                  <div>
                    <Link
                      href={`/coproprietes/${c.id}`}
                      className="font-medium leading-tight hover:text-primary hover:underline"
                    >
                      {c.nom}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {c.adresse ?? 'Adresse non renseignée'}
                    </p>
                  </div>
                </div>
                <Badge tone={statutTone[c.statut] ?? 'neutral'} dot>
                  {STATUT_COPRO[c.statut] ?? c.statut}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                <Meta icon={Globe2} label="Pays" value={c.pays} />
                <Meta icon={Coins} label="Devise" value={c.devise} />
                <Meta icon={CalendarDays} label="Créée" value={formatDate(c.dateCreation)} />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                <Link
                  href={`/coproprietes/${c.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ouvrir la fiche
                </Link>
                <Actions c={c} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} sur{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={pageSafe === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              Page {pageSafe} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={pageSafe === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
