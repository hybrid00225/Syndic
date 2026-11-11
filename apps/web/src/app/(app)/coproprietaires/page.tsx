'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  User,
  Building,
  Home,
  Search,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Printer,
  Download,
  RotateCcw,
  Mail,
  Phone,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { PERSONNE_TYPES, LABELS } from '@/lib/constants';

interface ContactT {
  type: string;
  valeur: string;
}
interface Personne {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
  actif: boolean;
  contacts: ContactT[];
  _count: { detentions: number };
}

const nomComplet = (p: Personne) =>
  p.type === 'MORALE' ? p.nom : `${p.prenom ?? ''} ${p.nom}`.trim();
const initiales = (p: Personne) =>
  p.type === 'MORALE'
    ? p.nom.slice(0, 2).toUpperCase()
    : `${(p.prenom ?? p.nom)[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase();

export default function CoproprietairesPage() {
  const confirm = useConfirm();
  const [list, setList] = useState<Personne[] | null>(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [view, setView] = useState<'table' | 'cards'>('table');

  const charger = () =>
    api<Personne[]>('/personnes').then(setList).catch(() => setList([]));
  useEffect(() => {
    charger();
  }, []);

  const filtered = useMemo(() => {
    if (!list) return [];
    const n = q.trim().toLowerCase();
    return list.filter(
      (p) =>
        (!n || nomComplet(p).toLowerCase().includes(n)) &&
        (!type || p.type === type),
    );
  }, [list, q, type]);

  if (!list) return <PageLoader />;

  const physiques = list.filter((p) => p.type === 'PHYSIQUE').length;
  const morales = list.filter((p) => p.type === 'MORALE').length;
  const lotsDetenus = list.reduce((s, p) => s + p._count.detentions, 0);
  const hasFilters = q || type;

  const exporter = () => {
    const header = ['Nom', 'Type', 'Email', 'Téléphone', 'Lots détenus'];
    const rows = filtered.map((p) => [
      nomComplet(p),
      LABELS[p.type] ?? p.type,
      p.contacts.find((c) => c.type === 'EMAIL')?.valeur ?? '',
      p.contacts.find((c) => c.type === 'TELEPHONE')?.valeur ?? '',
      p._count.detentions,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coproprietaires.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const supprimer = async (p: Personne) => {
    const ok = await confirm({
      title: `Supprimer « ${nomComplet(p)} » ?`,
      description: 'Le copropriétaire sera définitivement supprimé.',
      nextAction:
        "Impossible s'il détient des lots ou est lié à des paiements : retirez ces liens d'abord.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/personnes/${p.id}`, { method: 'DELETE' });
      charger();
    } catch (e) {
      await confirm({
        title: 'Suppression impossible',
        description: e instanceof Error ? e.message : 'Erreur',
        confirmLabel: 'Compris',
        tone: 'warning',
      });
    }
  };

  const Avatar = ({ p }: { p: Personne }) => (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        p.type === 'MORALE'
          ? 'bg-info/12 text-info'
          : 'bg-primary/10 text-primary',
      )}
    >
      {p.type === 'MORALE' ? <Building className="h-4 w-4" /> : initiales(p)}
    </span>
  );

  const Actions = ({ p }: { p: Personne }) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip label="Voir la fiche">
        <Link href={`/coproprietaires/${p.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <Eye className="h-4 w-4" />
        </Link>
      </Tooltip>
      <Tooltip label="Modifier">
        <Link href={`/coproprietaires/${p.id}/modifier`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </Link>
      </Tooltip>
      <Tooltip label="Supprimer">
        <button onClick={() => supprimer(p)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger">
          <Trash2 className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Copropriétaires' }]}
        title="Copropriétaires"
        subtitle={`${list.length} copropriétaire${list.length > 1 ? 's' : ''}.`}
        actions={
          <>
            <Tooltip label="Imprimer" side="bottom">
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
              <Link href="/coproprietaires/nouveau">
                <Plus className="h-4 w-4" /> Nouveau copropriétaire
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Copropriétaires" value={list.length} icon={Users} filled />
        <StatTile label="Personnes physiques" value={physiques} icon={User} tone="success" />
        <StatTile label="Personnes morales" value={morales} icon={Building} tone="info" />
        <StatTile label="Lots détenus" value={lotsDetenus} icon={Home} tone="warning" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un nom…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>
          <SearchSelect className="w-52" value={type} onChange={setType} options={PERSONNE_TYPES} allowEmpty emptyLabel="Tous les types" />
          {hasFilters && (
            <Tooltip label="Réinitialiser" side="bottom">
              <button onClick={() => { setQ(''); setType(''); }} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <RotateCcw className="h-4 w-4" /> Réinitialiser
              </button>
            </Tooltip>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
              <Tooltip label="Vue tableau" side="bottom">
                <button onClick={() => setView('table')} className={cn('flex h-8 w-8 items-center justify-center rounded-md', view === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <TableIcon className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="Vue cartes" side="bottom">
                <button onClick={() => setView('cards')} className={cn('flex h-8 w-8 items-center justify-center rounded-md', view === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <p className="mt-3 font-medium">Aucun copropriétaire</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length === 0 ? 'Créez votre premier copropriétaire.' : 'Aucun résultat pour ces filtres.'}
          </p>
          {list.length === 0 && (
            <Button asChild className="mt-4">
              <Link href="/coproprietaires/nouveau"><Plus className="h-4 w-4" /> Nouveau copropriétaire</Link>
            </Button>
          )}
        </Card>
      ) : view === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="border border-border px-4 py-3 font-semibold">Nom</th>
                <th className="border border-border px-4 py-3 font-semibold">Type</th>
                <th className="border border-border px-4 py-3 font-semibold">Email</th>
                <th className="border border-border px-4 py-3 font-semibold">Téléphone</th>
                <th className="border border-border px-4 py-3 font-semibold">Lots</th>
                <th className="border border-border px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="bg-card transition-colors hover:bg-muted/50">
                  <td className="border border-border px-4 py-3">
                    <Link href={`/coproprietaires/${p.id}`} className="flex items-center gap-2.5">
                      <Avatar p={p} />
                      <span className="font-medium hover:text-primary hover:underline">{nomComplet(p)}</span>
                    </Link>
                  </td>
                  <td className="border border-border px-4 py-3">
                    <Badge tone={p.type === 'MORALE' ? 'info' : 'primary'}>{LABELS[p.type] ?? p.type}</Badge>
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    {p.contacts.find((c) => c.type === 'EMAIL')?.valeur ?? '—'}
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    {p.contacts.find((c) => c.type === 'TELEPHONE')?.valeur ?? '—'}
                  </td>
                  <td className="border border-border px-4 py-3 nums">{p._count.detentions}</td>
                  <td className="border border-border px-4 py-3"><Actions p={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const email = p.contacts.find((c) => c.type === 'EMAIL')?.valeur;
            const tel = p.contacts.find((c) => c.type === 'TELEPHONE')?.valeur;
            return (
              <Card key={p.id} className="p-4 transition-shadow hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <Link href={`/coproprietaires/${p.id}`} className="flex items-center gap-3">
                    <span className={cn('flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold', p.type === 'MORALE' ? 'bg-info/12 text-info' : 'bg-primary/10 text-primary')}>
                      {p.type === 'MORALE' ? <Building className="h-5 w-5" /> : initiales(p)}
                    </span>
                    <div>
                      <p className="font-medium leading-tight hover:text-primary hover:underline">{nomComplet(p)}</p>
                      <Badge tone={p.type === 'MORALE' ? 'info' : 'primary'} className="mt-1">{LABELS[p.type] ?? p.type}</Badge>
                    </div>
                  </Link>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {p._count.detentions} lot{p._count.detentions > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {email ?? '—'}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {tel ?? '—'}</p>
                </div>
                <div className="mt-3 flex justify-end border-t border-border pt-2"><Actions p={p} /></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
