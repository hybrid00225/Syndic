'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  CheckCircle2,
  DoorOpen,
  Building2,
  Search,
  Eye,
  Pencil,
  Trash2,
  Printer,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
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
import { LOT_TYPES, LOT_STATUTS, LOT_STATUT_TONE, LABELS } from '@/lib/constants';

interface Lot {
  id: string;
  reference: string;
  type: string;
  designation: string | null;
  superficie: string | null;
  statut: string;
  coproprieteId: string;
  copropriete: { id: string; nom: string };
  batiment: { id: string; nom: string } | null;
}
interface Copro {
  id: string;
  nom: string;
}

const PAGE_SIZE = 10;

export default function LotsPage() {
  const confirm = useConfirm();
  const [lots, setLots] = useState<Lot[] | null>(null);
  const [copros, setCopros] = useState<Copro[]>([]);
  const [q, setQ] = useState('');
  const [copro, setCopro] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [voir, setVoir] = useState<Lot | null>(null);

  const charger = () =>
    api<Lot[]>('/lots').then(setLots).catch(() => setLots([]));
  useEffect(() => {
    charger();
    api<Copro[]>('/coproprietes').then(setCopros).catch(() => setCopros([]));
  }, []);
  useEffect(() => setPage(1), [q, copro, type, statut]);

  const filtered = useMemo(() => {
    if (!lots) return [];
    const n = q.trim().toLowerCase();
    return lots.filter(
      (l) =>
        (!n ||
          l.reference.toLowerCase().includes(n) ||
          (l.designation ?? '').toLowerCase().includes(n)) &&
        (!copro || l.coproprieteId === copro) &&
        (!type || l.type === type) &&
        (!statut || l.statut === statut),
    );
  }, [lots, q, copro, type, statut]);

  if (!lots) return <PageLoader />;

  const count = (s: string) => lots.filter((l) => l.statut === s).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = q || copro || type || statut;
  const reset = () => {
    setQ('');
    setCopro('');
    setType('');
    setStatut('');
  };

  const exporter = () => {
    const header = ['Référence', 'Copropriété', 'Type', 'Superficie', 'Bâtiment', 'Statut'];
    const rows = filtered.map((l) => [
      l.reference,
      l.copropriete.nom,
      LABELS[l.type] ?? l.type,
      l.superficie ?? '',
      l.batiment?.nom ?? '',
      LABELS[l.statut] ?? l.statut,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lots.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const supprimer = async (l: Lot) => {
    const ok = await confirm({
      title: `Supprimer le lot « ${l.reference} » ?`,
      description: `Lot de « ${l.copropriete.nom} ». Suppression définitive.`,
      nextAction:
        'Impossible si le lot est rattaché à un propriétaire, des tantièmes ou des appels de fonds.',
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/lots/${l.id}`, { method: 'DELETE' });
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

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Lots' }]}
        title="Lots"
        subtitle={`${lots.length} lot${lots.length > 1 ? 's' : ''} sur l'ensemble du portefeuille.`}
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
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Lots" value={lots.length} icon={Home} filled />
        <StatTile label="Occupés" value={count('OCCUPE_PROPRIETAIRE') + count('LOUE')} icon={CheckCircle2} tone="success" />
        <StatTile label="Vacants" value={count('VACANT')} icon={DoorOpen} tone="warning" />
        <StatTile label="Copropriétés" value={new Set(lots.map((l) => l.coproprieteId)).size} icon={Building2} tone="info" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une référence…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>
          <SearchSelect className="w-52" value={copro} onChange={setCopro} options={copros.map((c) => [c.id, c.nom] as const)} allowEmpty emptyLabel="Toutes les copropriétés" />
          <SearchSelect className="w-44" value={type} onChange={setType} options={LOT_TYPES} allowEmpty emptyLabel="Tous les types" />
          <SearchSelect className="w-56" value={statut} onChange={setStatut} options={LOT_STATUTS} allowEmpty emptyLabel="Tous les statuts" />
          {hasFilters && (
            <Tooltip label="Réinitialiser" side="bottom">
              <button onClick={reset} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                <RotateCcw className="h-4 w-4" /> Réinitialiser
              </button>
            </Tooltip>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Home className="h-6 w-6" />
          </div>
          <p className="mt-3 font-medium">Aucun lot</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {lots.length === 0
              ? 'Créez des lots depuis une copropriété.'
              : 'Aucun résultat pour ces filtres.'}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="border border-border px-4 py-3 font-semibold">Référence</th>
                <th className="border border-border px-4 py-3 font-semibold">Copropriété</th>
                <th className="border border-border px-4 py-3 font-semibold">Type</th>
                <th className="border border-border px-4 py-3 font-semibold">Superficie</th>
                <th className="border border-border px-4 py-3 font-semibold">Bâtiment</th>
                <th className="border border-border px-4 py-3 font-semibold">Statut</th>
                <th className="border border-border px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="bg-card transition-colors hover:bg-muted/50">
                  <td className="border border-border px-4 py-3 font-medium">{l.reference}</td>
                  <td className="border border-border px-4 py-3">
                    <Link href={`/coproprietes/${l.coproprieteId}`} className="text-primary hover:underline">
                      {l.copropriete.nom}
                    </Link>
                  </td>
                  <td className="border border-border px-4 py-3">{LABELS[l.type] ?? l.type}</td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">
                    {l.superficie ? `${l.superficie} m²` : '—'}
                  </td>
                  <td className="border border-border px-4 py-3 text-muted-foreground">{l.batiment?.nom ?? '—'}</td>
                  <td className="border border-border px-4 py-3">
                    <Badge tone={LOT_STATUT_TONE[l.statut] ?? 'neutral'} dot>
                      {LABELS[l.statut] ?? l.statut}
                    </Badge>
                  </td>
                  <td className="border border-border px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip label="Voir">
                        <button onClick={() => setVoir(l)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </button>
                      </Tooltip>
                      <Tooltip label="Modifier">
                        <Link href={`/coproprietes/${l.coproprieteId}/lots/${l.id}/modifier`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <button onClick={() => supprimer(l)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} sur {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" disabled={pageSafe === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <span className="px-2 text-sm text-muted-foreground">Page {pageSafe} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={pageSafe === totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {voir && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setVoir(null)}>
          <Card className="w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold">Lot {voir.reference}</h3>
              <button onClick={() => setVoir(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-2.5 p-4 text-sm">
              <ModalRow label="Copropriété" value={voir.copropriete.nom} />
              <ModalRow label="Type" value={LABELS[voir.type] ?? voir.type} />
              <ModalRow label="Désignation" value={voir.designation ?? '—'} />
              <ModalRow label="Superficie" value={voir.superficie ? `${voir.superficie} m²` : '—'} />
              <ModalRow label="Bâtiment" value={voir.batiment?.nom ?? '—'} />
              <ModalRow label="Statut" value={LABELS[voir.statut] ?? voir.statut} />
            </dl>
            <div className="flex justify-end gap-2 border-t border-border p-4">
              <Button asChild>
                <Link href={`/coproprietes/${voir.coproprieteId}/lots/${voir.id}/modifier`}>
                  <Pencil className="h-4 w-4" /> Modifier
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0')}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
