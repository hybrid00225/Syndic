import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  BellRing,
  Building2,
  Calculator,
  Check,
  FileStack,
  Globe2,
  KeyRound,
  Lock,
  Plus,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';
import { ProductPreview } from './product-preview';

// Grille de page : large (pas de colonne étroite centrée), gouttières généreuses.
const WRAP = 'mx-auto w-full max-w-[90rem] px-4 sm:px-8 lg:px-12';
const SECTION = 'scroll-mt-16 border-t border-border py-16 sm:py-24';
const INSCRIPTION = '/login?mode=register';

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-2xs font-semibold uppercase tracking-[0.14em] text-accent', className)}>{children}</p>
  );
}

function H2({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        'mt-3 text-balance font-display text-[2rem] font-medium leading-[1.08] tracking-tight sm:text-[2.75rem]',
        className,
      )}
    >
      {children}
    </h2>
  );
}

// ------------------------------------------------------------------ Héros

export function Hero() {
  return (
    <section aria-labelledby="titre-hero" className="overflow-x-clip pb-20 pt-12 sm:pt-16 lg:pb-28 lg:pt-20">
      <div className={cn(WRAP, 'grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10')}>
        <div className="min-w-0 lg:col-span-5">
          <Badge tone="primary">Logiciel de gestion de syndic de copropriété</Badge>
          <h1
            id="titre-hero"
            className="mt-5 text-balance font-display text-[2.5rem] font-medium leading-[1.02] tracking-tight sm:text-6xl xl:text-[4.25rem]"
          >
            Gérez vos copropriétés <em className="text-primary">au tantième près.</em>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Patrimoine, copropriétaires, tantièmes, appels de fonds et encaissements réunis dans un seul
            registre. Chaque montant se justifie, chaque opération laisse une trace — fini les tableurs qui
            divergent.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={INSCRIPTION}>
                Créer mon espace <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#fonctionnalites">Voir les fonctionnalités</a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-ui text-muted-foreground">
            {['Multi-copropriétés', 'Devise par copropriété', 'Données isolées par syndic'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check aria-hidden className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Constat

const DOULEURS = [
  {
    t: 'Des tableurs qui divergent',
    d: 'Une version par gestionnaire, des formules cassées, et plus personne ne sait quel fichier fait foi.',
  },
  {
    t: 'Des appels de fonds faits à la main',
    d: 'Calculer la part de chaque lot, éditer chaque relevé, puis tout recommencer au trimestre suivant.',
  },
  {
    t: 'Des tantièmes contestés',
    d: 'Arrondis, quotes-parts qui ne font pas 100 %, ancien barème appliqué : la porte ouverte aux litiges.',
  },
  {
    t: 'Des impayés qui s’installent',
    d: 'Sans solde à jour ni jours de retard, la relance part trop tard — et la trésorerie de l’immeuble trinque.',
  },
  {
    t: 'Des paiements mal affectés',
    d: 'Un virement pour trois lots, un acompte, un trop-perçu : difficile de dire ce qui solde quoi.',
  },
  {
    t: 'Aucune traçabilité en AG',
    d: '« Qui a modifié ce montant, et quand ? » La question revient à chaque assemblée générale.',
  },
];

export function Constat() {
  return (
    <section aria-labelledby="titre-constat" className={SECTION}>
      <div className={cn(WRAP, 'grid gap-10 lg:grid-cols-12')}>
        <div className="lg:col-span-4">
          <Eyebrow>Le constat</Eyebrow>
          <H2 id="titre-constat">Un syndic ne devrait pas tenir dans un tableur.</H2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Les copropriétaires attendent des comptes justes et des réponses rapides. Les outils bricolés ne
            suivent plus.
          </p>
        </div>
        <ol className="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
          {DOULEURS.map((p, i) => (
            <li key={p.t} className="border-t border-border py-6">
              <span aria-hidden className="nums font-display text-sm text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{p.t}</h3>
              <p className="mt-1.5 text-muted-foreground">{p.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Fonctionnalités

const FONCTIONS = [
  {
    icon: Building2,
    t: 'Patrimoine structuré',
    d: 'Copropriétés, bâtiments, niveaux et lots — appartements, commerces, bureaux, parkings, caves. Parties communes, équipements et accès. Création guidée en une seule fois.',
  },
  {
    icon: UsersRound,
    t: 'Copropriétaires & propriété',
    d: 'Personnes physiques et morales, contacts. Un lot peut avoir plusieurs propriétaires : quote-part, nature du droit (pleine propriété, usufruit, nue-propriété, indivision) et dates.',
  },
  {
    icon: ReceiptText,
    t: 'Appels de fonds',
    d: 'Génération par tantièmes, clés de répartition, montant fixe ou mode mixte. Numéro unique, relevé consolidé par copropriétaire. Un appel validé est figé : toute correction passe par une annulation tracée.',
  },
  {
    icon: Banknote,
    t: 'Encaissements & affectations',
    d: 'Espèces, virement, chèque, carte, Mobile Money… Le paiement et son affectation sont distincts : paiements partiels, groupés sur plusieurs lots, avances. Protection contre les doubles saisies.',
  },
  {
    icon: BellRing,
    t: 'Impayés & recouvrement',
    d: 'Solde par copropriétaire, jours de retard, liste des impayés et historique des relances (courrier, email, SMS) au même endroit.',
  },
  {
    icon: FileStack,
    t: 'Documents & règlement',
    d: 'Pièces rattachées à chaque copropriété, règlement de copropriété versionné. Budgets et exercices par copropriété.',
  },
  {
    icon: ScrollText,
    t: 'Journal d’audit & rôles',
    d: 'Chaque opération sensible est tracée : auteur, action, date. Rôles par copropriété : administrateur, gestionnaire, comptable, caissier.',
  },
  {
    icon: Globe2,
    t: 'Multi-copropriétés, multi-pays, multi-devises',
    d: 'Tout votre portefeuille dans un espace. Pays et devise définis par copropriété (XOF, XAF, EUR, MAD, CHF, CAD…), montants en entiers, sans erreur d’arrondi.',
  },
];

export function Fonctionnalites() {
  return (
    <section id="fonctionnalites" aria-labelledby="titre-fonctionnalites" className={SECTION}>
      <div className={WRAP}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <Eyebrow>Fonctionnalités</Eyebrow>
            <H2 id="titre-fonctionnalites">Un seul registre, du lot jusqu’à l’encaissement.</H2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Chaque module s’appuie sur le précédent : le patrimoine alimente les tantièmes, les tantièmes les
            appels, les appels les encaissements et le recouvrement.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {/* Tuile héro : la justesse des tantièmes */}
          <div className="flex flex-col justify-between gap-8 bg-primary p-6 text-primary-foreground sm:col-span-2 sm:p-8">
            <div>
              <Calculator aria-hidden className="h-5 w-5" />
              <h3 className="mt-4 font-display text-2xl font-medium">Tantièmes justes, calculés en fractions exactes</h3>
              <p className="mt-2 max-w-lg text-primary-foreground/80">
                Les quotes-parts sont stockées en fractions, jamais en décimales approximatives. Les clés de
                répartition sont versionnées par période : chaque appel utilise le barème en vigueur à sa date.
              </p>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-display text-3xl sm:text-4xl" role="img" aria-label="Un tiers plus un tiers plus un tiers égale un">
              <span aria-hidden className="nums">1/3 + 1/3 + 1/3</span>
              <span aria-hidden className="text-primary-foreground/60">=</span>
              <span aria-hidden className="nums italic">1</span>
              <span aria-hidden className="ml-1 font-sans text-ui text-primary-foreground/70">pas 0,9999</span>
            </div>
          </div>

          {FONCTIONS.map((f) => (
            <div key={f.t} className="bg-card p-6 sm:p-7">
              <f.icon aria-hidden className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{f.t}</h3>
              <p className="mt-2 text-ui leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}

          <div className="flex flex-col justify-between gap-6 bg-card p-6 sm:col-span-2 sm:p-7">
            <p className="max-w-lg font-display text-xl font-medium leading-snug">
              Tous les montants sont des entiers dans la devise de la copropriété : ce qui est appelé est
              exactement ce qui est dû.
            </p>
            <Button asChild variant="secondary" className="self-start">
              <Link href={INSCRIPTION}>
                Essayer sur ma copropriété <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Démarrage

const ETAPES = [
  {
    t: 'Créez votre espace syndic',
    d: 'Nom du syndic, pays, compte administrateur. Quelques minutes suffisent, sans installation.',
  },
  {
    t: 'Décrivez vos copropriétés',
    d: 'L’assistant enchaîne bâtiments, niveaux, lots, copropriétaires, quotes-parts et tantièmes.',
  },
  {
    t: 'Appelez et encaissez',
    d: 'Générez l’appel, enregistrez les paiements, affectez-les et suivez les impayés en temps réel.',
  },
];

export function Demarrage() {
  return (
    <section id="demarrage" aria-labelledby="titre-demarrage" className={SECTION}>
      <div className={WRAP}>
        <Eyebrow>Démarrage</Eyebrow>
        <H2 id="titre-demarrage" className="max-w-3xl">
          Trois étapes entre votre tableur et votre premier appel.
        </H2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {ETAPES.map((e, i) => (
            <li key={e.t} className="relative border-t-2 border-foreground pt-6">
              <span aria-hidden className="nums font-display text-6xl font-medium leading-none text-primary">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                <span className="sr-only">Étape {i + 1} : </span>
                {e.t}
              </h3>
              <p className="mt-2 max-w-sm text-muted-foreground">{e.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Pour qui

const PUBLICS = [
  {
    t: 'Syndics professionnels',
    d: 'Plusieurs gestionnaires, des dizaines d’immeubles : un cadre commun, des rôles par copropriété et une traçabilité complète pour rendre des comptes.',
    points: ['Rôles par copropriété', 'Journal d’audit', 'Vue globale des lots'],
  },
  {
    t: 'Syndics bénévoles',
    d: 'Un copropriétaire qui gère son immeuble sans être comptable : un outil qui calcule juste à sa place et garde l’historique.',
    points: ['Création guidée', 'Calculs automatiques', 'Historique des paiements'],
  },
  {
    t: 'Gestionnaires de portefeuille',
    d: 'Des résidences dans plusieurs villes ou pays : chaque copropriété garde son pays, sa devise et son mode de répartition.',
    points: ['Multi-pays', 'Multi-devises', 'Tableau de bord consolidé'],
  },
];

export function PourQui() {
  return (
    <section id="pour-qui" aria-labelledby="titre-pour-qui" className={SECTION}>
      <div className={cn(WRAP, 'grid gap-10 lg:grid-cols-12')}>
        <div className="lg:col-span-4">
          <Eyebrow>Pour qui</Eyebrow>
          <H2 id="titre-pour-qui">Conçu pour ceux qui rendent des comptes.</H2>
        </div>
        <ul className="grid gap-4 md:grid-cols-3 lg:col-span-8">
          {PUBLICS.map((p, i) => (
            <li
              key={p.t}
              className={cn(
                'flex flex-col rounded-lg border p-6',
                i === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
              )}
            >
              <h3 className="font-display text-xl font-medium">{p.t}</h3>
              <p className={cn('mt-2 text-ui leading-relaxed', i === 0 ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {p.d}
              </p>
              <ul className="mt-auto space-y-1.5 pt-6 text-ui">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2">
                    <Check aria-hidden className={cn('h-3.5 w-3.5', i === 0 ? 'text-primary-foreground' : 'text-primary')} strokeWidth={2.5} />
                    {pt}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Sécurité

const GARANTIES = [
  {
    icon: Lock,
    t: 'Données cloisonnées par syndic',
    d: 'Votre syndic est déduit de votre session, jamais d’un paramètre modifiable. L’accès aux copropriétés est contrôlé côté serveur.',
  },
  {
    icon: ScrollText,
    t: 'Journal d’audit en ajout seul',
    d: 'Les opérations sensibles sont enregistrées avec leur auteur et leur horodatage. Le journal fonctionne en ajout seul : ni modification, ni suppression.',
  },
  {
    icon: KeyRound,
    t: 'Rôles et sessions',
    d: 'Rôles distincts par copropriété. Mots de passe hachés (bcrypt), sessions à durée limitée, tentatives de connexion limitées.',
  },
  {
    icon: ShieldCheck,
    t: 'Comptes qui ne se réécrivent pas',
    d: 'Un appel validé ne se modifie pas en silence, un paiement n’est pas confondu avec son affectation : chaque correction reste visible.',
  },
];

export function Securite() {
  return (
    <section id="securite" aria-labelledby="titre-securite" className={SECTION}>
      <div className={cn(WRAP, 'grid gap-10 lg:grid-cols-12')}>
        <div className="lg:col-span-5">
          <Eyebrow>Sécurité & traçabilité</Eyebrow>
          <H2 id="titre-securite">L’argent des copropriétaires mérite un registre irréprochable.</H2>
          <p className="mt-4 max-w-md text-muted-foreground">
            La sécurité est dans le modèle de données, pas en option. Hébergement et sauvegardes : les modalités
            sont précisées par écrit avec chaque syndic avant la mise en production.
          </p>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:col-span-7">
          {GARANTIES.map((g) => (
            <li key={g.t} className="bg-card p-6">
              <g.icon aria-hidden className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{g.t}</h3>
              <p className="mt-1.5 text-ui leading-relaxed text-muted-foreground">{g.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Bientôt

const BIENTOT = [
  { t: 'Appels de fonds et reçus en PDF', d: 'Un document par copropriétaire, prêt à envoyer.' },
  { t: 'Relances automatiques', d: 'Email, SMS et WhatsApp selon un calendrier défini.' },
  { t: 'Paiement Mobile Money intégré', d: 'Confirmation automatique par l’opérateur, sans saisie.' },
  { t: 'Comptabilité en partie double', d: 'Journaux, grand livre, balance — plan OHADA inclus.' },
  { t: 'Assemblées générales & votes', d: 'Convocations, feuille de présence, majorités, procès-verbal.' },
  { t: 'Portail copropriétaire & app mobile', d: 'Chaque copropriétaire consulte son solde et ses documents.' },
];

export function Bientot() {
  return (
    <section id="bientot" aria-labelledby="titre-bientot" className={SECTION}>
      <div className={WRAP}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <Eyebrow>Feuille de route</Eyebrow>
            <H2 id="titre-bientot">Ce qui arrive ensuite.</H2>
          </div>
          <p className="max-w-md text-muted-foreground">
            En préparation, pas encore disponible. Nous l’annonçons pour que vous sachiez où va le produit —
            sans le vendre avant qu’il existe.
          </p>
        </div>
        <ul className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">
          {BIENTOT.map((b) => (
            <li key={b.t} className="border-b border-border py-5 sm:pr-8">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{b.t}</h3>
                <Badge tone="warning">Bientôt</Badge>
              </div>
              <p className="mt-1 text-ui text-muted-foreground">{b.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ FAQ

const QUESTIONS = [
  {
    q: 'Syndic Alpha convient-il à un syndic bénévole ?',
    r: 'Oui. Chaque copropriété indique si son syndic est professionnel ou bénévole. La création guidée et les calculs automatiques évitent d’avoir à maîtriser la comptabilité pour produire des appels justes.',
  },
  {
    q: 'Dans quels pays et quelles devises puis-je l’utiliser ?',
    r: 'Le produit est international : pays et devise sont définis copropriété par copropriété (franc CFA, euro, dirham, franc suisse, dollar canadien…). Un même syndic peut gérer des immeubles dans plusieurs pays.',
  },
  {
    q: 'Comment sont calculées les parts de chaque lot ?',
    r: 'Selon le mode choisi pour la copropriété : tantièmes, clés de répartition (charges générales, ascenseur, eau…), montant fixe ou mixte. Les quotes-parts sont des fractions exactes et chaque appel utilise la version du barème en vigueur à sa date.',
  },
  {
    q: 'Puis-je encaisser par Mobile Money ?',
    r: 'Vous pouvez dès aujourd’hui enregistrer un paiement Mobile Money, avec protection contre les doubles saisies. La confirmation automatique par les opérateurs est en préparation.',
  },
  {
    q: 'Qui peut voir mes données ?',
    r: 'Uniquement les utilisateurs de votre syndic, selon le rôle qui leur est attribué sur chaque copropriété. Les données d’un syndic ne sont jamais accessibles depuis un autre.',
  },
  {
    q: 'Combien ça coûte ?',
    r: 'La tarification est établie sur devis, selon la taille de votre portefeuille. Vous pouvez créer votre espace et découvrir le produit avant d’en discuter.',
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="titre-faq" className={SECTION}>
      <div className={cn(WRAP, 'grid gap-10 lg:grid-cols-12')}>
        <div className="lg:col-span-4">
          <Eyebrow>Questions fréquentes</Eyebrow>
          <H2 id="titre-faq">Ce qu’on nous demande avant de commencer.</H2>
        </div>
        <div className="divide-y divide-border border-y border-border lg:col-span-8">
          {QUESTIONS.map((x) => (
            <details key={x.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                <span className="text-base sm:text-lg">{x.q}</span>
                <Plus aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-2xl pb-6 text-muted-foreground">{x.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Appel final

export function AppelFinal() {
  return (
    <section aria-labelledby="titre-appel-final" className="pb-16 sm:pb-24">
      <div className={WRAP}>
        <div className="grid gap-8 rounded-lg bg-primary px-6 py-12 text-primary-foreground sm:px-12 lg:grid-cols-12 lg:items-end lg:py-16">
          <div className="lg:col-span-8">
            <h2 id="titre-appel-final" className="text-balance font-display text-[2rem] font-medium leading-[1.05] tracking-tight sm:text-5xl">
              Votre prochain appel de fonds, <em>sans tableur.</em>
            </h2>
            <p className="mt-4 max-w-xl text-primary-foreground/80">
              Créez votre espace, ajoutez une première copropriété et vérifiez par vous-même que les comptes
              tombent juste.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:flex-col lg:items-stretch xl:flex-row xl:justify-end">
            <Button asChild size="lg" variant="secondary" className="border-transparent">
              <Link href={INSCRIPTION}>
                Créer mon espace <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
            >
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Pied de page

export function PiedDePage() {
  return (
    <footer className="border-t border-border">
      <div className={cn(WRAP, 'flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between')}>
        <div className="max-w-xs">
          <Wordmark subtitle="Gestion de copropriété" />
          <p className="mt-4 text-ui text-muted-foreground">
            Le registre des syndics de copropriété : patrimoine, tantièmes, appels de fonds et recouvrement.
          </p>
        </div>
        <nav aria-label="Pied de page" className="grid grid-cols-2 gap-x-12 gap-y-2 text-ui sm:grid-cols-3">
          {[
            ['#fonctionnalites', 'Fonctionnalités'],
            ['#demarrage', 'Démarrage'],
            ['#pour-qui', 'Pour qui'],
            ['#securite', 'Sécurité'],
            ['#bientot', 'Feuille de route'],
            ['#faq', 'FAQ'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {label}
            </a>
          ))}
          <Link href="/login" className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Se connecter
          </Link>
          <Link href={INSCRIPTION} className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Créer mon espace
          </Link>
        </nav>
      </div>
      <div className={cn(WRAP, 'border-t border-border py-5 text-2xs text-muted-foreground')}>
        © {new Date().getFullYear()} Syndic Alpha
      </div>
    </footer>
  );
}
