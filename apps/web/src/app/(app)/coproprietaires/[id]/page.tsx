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
import { Table, THead, Th, Td, Tr } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ledger, Stat, Composition } from '@/components/ui/stat';
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
        back="/coproprietaires"
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

      <Ledger>
        <Stat
          lead
          label="Lots détenus"
          value={p.detentions.length}
          info="Lots sur lesquels ce copropriétaire détient un droit, par nature du droit."
          viz={
            <Composition
              segments={[
                { label: 'Pleine propriété', value: p.detentions.filter((d) => d.natureDroit === 'PLEINE_PROPRIETE').length, tone: 'ink' },
                { label: 'Indivision', value: p.detentions.filter((d) => d.natureDroit === 'INDIVISION').length, tone: 'soft' },
                { label: 'Usufruit', value: p.detentions.filter((d) => d.natureDroit === 'USUFRUIT').length, tone: 'warn' },
                { label: 'Nue-propriété', value: p.detentions.filter((d) => d.natureDroit === 'NUE_PROPRIETE').length, tone: 'empty' },
              ]}
            />
          }
        />
        <Stat
          label="Copropriétés"
          value={new Set(p.detentions.map((d) => d.lot.coproprieteId)).size}
          info="Copropriétés distinctes dans lesquelles il détient des lots."
          note="concernées"
        />
        <Stat
          label="Coordonnées"
          value={p.contacts.length}
          tone={p.contacts.length === 0 ? 'danger' : 'default'}
          info="Emails, téléphones et adresses enregistrés pour les appels de fonds et relances."
          note={p.contacts.length === 0 ? 'injoignable : ajoutez un email' : p.contacts.map((c) => LABELS[c.type] ?? c.type).join(' · ')}
        />
        <Stat
          label="Statut"
          value={p.actif ? 'Actif' : 'Inactif'}
          tone={p.actif ? 'default' : 'warning'}
          info="Une fiche inactive n'est plus proposée dans les nouvelles attributions de lots."
          note={p.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
        />
      </Ledger>

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
            <Table className="mt-3">
              <THead>
                <Th>Lot</Th>
                <Th>Copropriété</Th>
                <Th numeric>Quote-part</Th>
                <Th>Nature du droit</Th>
                <Th>Période</Th>
              </THead>
              <tbody>
                {p.detentions.map((d) => (
                  <Tr key={d.id} href={`/coproprietes/${d.lot.coproprieteId}/lots/${d.lot.id}/modifier`}>
                    <Td>
                      <Link
                        href={`/coproprietes/${d.lot.coproprieteId}/lots/${d.lot.id}/modifier`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {d.lot.reference}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/coproprietes/${d.lot.coproprieteId}`} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        {d.lot.copropriete.nom}
                      </Link>
                    </Td>
                    <Td numeric>
                      {d.quotePartNum}/{d.quotePartDen}
                      <span className="ml-1.5 text-2xs text-muted-foreground">
                        {Math.round((d.quotePartNum / d.quotePartDen) * 100)} %
                      </span>
                    </Td>
                    <Td>{LABELS[d.natureDroit] ?? d.natureDroit}</Td>
                    <Td className="nums text-muted-foreground">
                      {formatDate(d.dateDebut)}
                      {d.dateFin ? ` → ${formatDate(d.dateFin)}` : ' → en cours'}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
