'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Pencil,
  Trash2,
  User,
  Building,
  Home,
  Mail,
  Phone,
  MapPin,
  Contact as ContactIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatTile } from '@/components/ui/stat-tile';
import { useConfirm } from '@/components/ui/confirm';
import { PageLoader } from '@/components/ui/spinner';
import { PageHeader } from '@/components/page-header';
import { formatDate, cn } from '@/lib/utils';
import { LABELS } from '@/lib/constants';

interface Contact {
  id: string;
  type: string;
  valeur: string;
  libelle: string | null;
}
interface Detention {
  id: string;
  quotePartNum: number;
  quotePartDen: number;
  natureDroit: string;
  dateDebut: string;
  dateFin: string | null;
  lot: {
    id: string;
    reference: string;
    coproprieteId: string;
    copropriete: { nom: string };
  };
}
interface Personne {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
  actif: boolean;
  createdAt: string;
  contacts: Contact[];
  detentions: Detention[];
}

const contactIcon = (t: string) =>
  t === 'EMAIL' ? Mail : t === 'TELEPHONE' ? Phone : MapPin;

export default function CoproprietaireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const [p, setP] = useState<Personne | null>(null);

  useEffect(() => {
    api<Personne>(`/personnes/${id}`).then(setP).catch(() => setP(null));
  }, [id]);

  if (!p) return <PageLoader />;

  const nom = p.type === 'MORALE' ? p.nom : `${p.prenom ?? ''} ${p.nom}`.trim();
  const initiales =
    p.type === 'MORALE'
      ? p.nom.slice(0, 2).toUpperCase()
      : `${(p.prenom ?? p.nom)[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase();

  const supprimer = async () => {
    const ok = await confirm({
      title: `Supprimer « ${nom} » ?`,
      description: 'Le copropriétaire sera définitivement supprimé.',
      nextAction: "Impossible s'il détient des lots : retirez-les d'abord.",
      confirmLabel: 'Supprimer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/personnes/${id}`, { method: 'DELETE' });
      router.push('/coproprietaires');
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
        crumbs={[
          { label: 'Espace', href: '/dashboard' },
          { label: 'Copropriétaires', href: '/coproprietaires' },
          { label: nom },
        ]}
        title={nom}
        subtitle={LABELS[p.type] ?? p.type}
        actions={
          <>
            <Button variant="secondary" onClick={supprimer}>
              <Trash2 className="h-4 w-4" /> Supprimer
            </Button>
            <Button asChild>
              <Link href={`/coproprietaires/${id}/modifier`}>
                <Pencil className="h-4 w-4" /> Modifier
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Lots détenus" value={p.detentions.length} icon={Home} filled />
        <StatTile label="Coordonnées" value={p.contacts.length} icon={ContactIcon} tone="info" />
        <StatTile
          label="Type"
          value={p.type === 'MORALE' ? 'Morale' : 'Physique'}
          icon={p.type === 'MORALE' ? Building : User}
          tone="success"
        />
        <StatTile label="Statut" value={p.actif ? 'Actif' : 'Inactif'} icon={User} tone="warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Identité + coordonnées */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className={cn('flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold', p.type === 'MORALE' ? 'bg-info/12 text-info' : 'bg-primary/10 text-primary')}>
              {p.type === 'MORALE' ? <Building className="h-6 w-6" /> : initiales}
            </span>
            <div>
              <p className="font-semibold">{nom}</p>
              <Badge tone={p.type === 'MORALE' ? 'info' : 'primary'} className="mt-1">{LABELS[p.type] ?? p.type}</Badge>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-semibold">Coordonnées</h3>
          {p.contacts.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Aucune coordonnée.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {p.contacts.map((c) => {
                const Icon = contactIcon(c.type);
                return (
                  <li key={c.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-medium">{c.valeur}</p>
                      <p className="text-xs text-muted-foreground">
                        {LABELS[c.type] ?? c.type}
                        {c.libelle ? ` · ${c.libelle}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
            Enregistré le {formatDate(p.createdAt)}
          </p>
        </Card>

        {/* Lots détenus */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold">Lots détenus ({p.detentions.length})</h3>
          {p.detentions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Home className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium">Aucun lot détenu</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Attribuez des lots depuis la fiche d&apos;un lot.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="border border-border px-3 py-2.5 font-semibold">Lot</th>
                    <th className="border border-border px-3 py-2.5 font-semibold">Copropriété</th>
                    <th className="border border-border px-3 py-2.5 font-semibold">Quote-part</th>
                    <th className="border border-border px-3 py-2.5 font-semibold">Nature</th>
                    <th className="border border-border px-3 py-2.5 font-semibold">Période</th>
                  </tr>
                </thead>
                <tbody>
                  {p.detentions.map((d) => (
                    <tr key={d.id} className="bg-card">
                      <td className="border border-border px-3 py-2.5 font-medium">
                        <Link href={`/coproprietes/${d.lot.coproprieteId}/lots/${d.lot.id}/modifier`} className="hover:text-primary hover:underline">
                          {d.lot.reference}
                        </Link>
                      </td>
                      <td className="border border-border px-3 py-2.5">
                        <Link href={`/coproprietes/${d.lot.coproprieteId}`} className="text-primary hover:underline">
                          {d.lot.copropriete.nom}
                        </Link>
                      </td>
                      <td className="border border-border px-3 py-2.5 nums">
                        {d.quotePartNum}/{d.quotePartDen}
                      </td>
                      <td className="border border-border px-3 py-2.5">
                        <Badge tone="neutral">{LABELS[d.natureDroit] ?? d.natureDroit}</Badge>
                      </td>
                      <td className="border border-border px-3 py-2.5 text-muted-foreground">
                        {formatDate(d.dateDebut)}
                        {d.dateFin ? ` → ${formatDate(d.dateFin)}` : ' → en cours'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
