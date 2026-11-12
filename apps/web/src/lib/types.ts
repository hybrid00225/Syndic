// Types partagés du front (miroir des réponses de l'API).
// Une seule source : ne plus redéclarer ces interfaces dans les pages.

export interface CoproRef {
  id: string;
  nom: string;
}

export interface Copropriete {
  id: string;
  nom: string;
  reference: string | null;
  type: string;
  pays: string;
  adresse: string | null;
  ensembleImmobilier: string | null;
  devise: string;
  natureSyndic: string;
  description: string | null;
  statut: string;
  dateCreation: string;
  dateMiseExploitation: string | null;
  batiments?: BatimentRef[];
}

export interface BatimentRef {
  id: string;
  nom: string;
}

export interface Batiment extends BatimentRef {
  coproprieteId: string;
  copropriete: CoproRef;
  _count: { niveaux: number; lots: number };
}

export interface Niveau {
  id: string;
  nom: string;
  ordre: number;
}

export interface Lot {
  id: string;
  reference: string;
  type: string;
  designation: string | null;
  superficie: string | null;
  statut: string;
  coproprieteId: string;
  batimentId: string | null;
  niveauId: string | null;
  copropriete?: CoproRef;
  batiment?: BatimentRef | null;
}

export interface Contact {
  id?: string;
  type: string;
  valeur: string;
  libelle?: string | null;
}

export interface PersonneRef {
  id: string;
  type: string;
  nom: string;
  prenom: string | null;
}

export interface Personne extends PersonneRef {
  actif: boolean;
  statut?: string;
  modeNotification?: string;
  createdAt?: string;
  contacts: Contact[];
  _count?: { detentions: number };
  detentions?: DetentionAvecLot[];
}

export interface Detention {
  id: string;
  quotePartNum: number;
  quotePartDen: number;
  natureDroit: string;
  dateDebut: string;
  dateFin: string | null;
}

export interface DetentionAvecLot extends Detention {
  lot: {
    id: string;
    reference: string;
    coproprieteId: string;
    copropriete: { nom: string };
  };
}

export interface DetentionAvecPersonne extends Detention {
  personne: PersonneRef;
}

export function nomPersonne(p: Pick<PersonneRef, 'type' | 'nom' | 'prenom'>) {
  return p.type === 'MORALE' ? p.nom : `${p.prenom ?? ''} ${p.nom}`.trim();
}
