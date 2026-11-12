import type { Metadata } from 'next';
import { LandingHeader } from '@/components/landing/header';
import {
  AppelFinal,
  Bientot,
  Constat,
  Demarrage,
  Faq,
  Fonctionnalites,
  Hero,
  PiedDePage,
  PourQui,
  Securite,
} from '@/components/landing/sections';

const TITRE = 'Syndic Alpha — Logiciel de gestion de syndic de copropriété';
const DESCRIPTION =
  'Patrimoine, copropriétaires, tantièmes, appels de fonds, encaissements et recouvrement dans un seul registre tracé. Multi-copropriétés, multi-pays, multi-devises.';

export const metadata: Metadata = {
  title: { absolute: TITRE },
  description: DESCRIPTION,
  // Page publique : on lève le noindex posé par le layout racine (espace privé).
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Syndic Alpha',
    title: TITRE,
    description: DESCRIPTION,
  },
};

export default function Accueil() {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <LandingHeader />
      <main id="contenu">
        <Hero />
        <Constat />
        <Fonctionnalites />
        <Demarrage />
        <PourQui />
        <Securite />
        <Bientot />
        <Faq />
        <AppelFinal />
      </main>
      <PiedDePage />
    </>
  );
}
