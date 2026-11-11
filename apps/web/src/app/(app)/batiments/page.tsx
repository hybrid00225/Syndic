'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Layers,
  Home,
  Landmark,
  Search,
  Eye,
  Pencil,
  Trash2,
  Printer,
  Download,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatTile } from '@/components/ui/stat-tile';
import { SearchSelect } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { PageHeader } from '@/components/page-header';

interface Batiment {
  id: string;
  nom: string;
  coproprieteId: string;
  copropriete: { id: string; nom: string };
  _count: { niveaux: number; lots: number };
}
interface Copro {
  id: string;
  nom: string;
}

export default function BatimentsPage() {
  const confirm = useConfirm();
  const [batiments, setBatiments] = useState<Batiment[] | null>(null);
  const [copros, setCopros] = useState<Copro[]>([]);
  const [q, setQ] = useState('');
  const [copro, setCopro] = useState('');

  const charger = () =>
    api<Batiment[]>('/batiments').then(setBatiments).catch(() => setBatiments([]));
  useEffect(() => {
    charger();
    api<Copro[]>('/coproprietes').then(setCopros).catch(() => setCopros([]));
  }, []);

  const filtered = useMemo(() => {
    if (!batiments) return [];
    const n = q.trim().toLowerCase();
    return batiments.filter(
      (b) =>
        (!n || b.nom.toLowerCase().includes(n)) &&
        (!copro || b.coproprieteId === copro),
    );
  }, [batiments, q, copro]);

  if (!batiments) return <PageLoader />;

  const sumNiv = batiments.reduce((s, b) => s + b._count.niveaux, 0);
  const sumLots = batiments.reduce((s, b) => s + b._count.lots, 0);
  const hasFilters = q || copro;

  const exporter = () => {
    const header = ['Bâtiment', 'Copropriété', 'Niveaux', 'Lots'];
    const rows = filtered.map((b) => [b.nom, b.copropriete.nom, b._count.niveaux, b._count.lots]);
    const csv = [header, ...rows]
      .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batiments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const supprimer = async (b: Batiment) => {
    const ok = await confirm({
      title: `Supprimer « ${b.nom} » ?`,
      description: `Bâtiment de « ${b.copropriete.nom} ». Suppression définitive.`,
      nextAction: "Impossible s'il contient des niveaux ou des lots.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/batiments/${b.id}`, { method: 'DELETE' });
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
        crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: 'Bâtiments' }]}
        title="Bâtiments"
        subtitle={`${batiments.length} bâtiment${batiments.length > 1 ? 's' : ''} sur l'ensemble du portefeuille.`}
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
        <StatTile label="Bâtiments" value={batiments.length} icon={Building2} filled />
        <StatTile label="Niveaux" value={sumNiv} icon={Layers} tone="info" />
        <StatTile label="Lots" value={sumLots} icon={Home} tone="success" />
        <StatTile label="Copropriétés" value={new Set(batiments.map((b) => b.coproprieteId)).size} icon={Landmark} tone="warning" />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un bâtiment…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            />
          </div>
          <SearchSelect className="w-56" value={copro} onChange={setCopro} options={copros.map((c) => [c.id, c.nom] as const)} allowEmpty emptyLabel="Toutes les copropriétés" />
          {hasFilters && (
            <Tooltip label="Réinitialiser" side="bottom">
              <button onClick={() => { setQ(''); setCopro(''); }} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
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
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-3 font-medium">Aucun bâtiment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez des bâtiments depuis une copropriété.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="border border-border px-4 py-3 font-semibold">Bâtiment</th>
                <th className="border border-border px-4 py-3 font-semibold">Copropriété</th>
                <th className="border border-border px-4 py-3 font-semibold">Niveaux</th>
                <th className="border border-border px-4 py-3 font-semibold">Lots</th>
                <th className="border border-border px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="bg-card transition-colors hover:bg-muted/50">
                  <td className="border border-border px-4 py-3">
                    <span className="flex items-center gap-2.5 font-medium">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </span>
                      {b.nom}
                    </span>
                  </td>
                  <td className="border border-border px-4 py-3">
                    <Link href={`/coproprietes/${b.coproprieteId}`} className="text-primary hover:underline">
                      {b.copropriete.nom}
                    </Link>
                  </td>
                  <td className="border border-border px-4 py-3 nums">{b._count.niveaux}</td>
                  <td className="border border-border px-4 py-3 nums">{b._count.lots}</td>
                  <td className="border border-border px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip label="Voir dans la copropriété">
                        <Link href={`/coproprietes/${b.coproprieteId}?tab=patrimoine`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Tooltip>
                      <Tooltip label="Gérer / renommer">
                        <Link href={`/coproprietes/${b.coproprieteId}?tab=patrimoine`} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <button onClick={() => supprimer(b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger">
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
    </div>
  );
}
