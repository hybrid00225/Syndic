// Liste internationale (le produit n'est pas restreint à une région).
// Ordre alphabétique : aucune région n'est privilégiée.
export const PAYS: [string, string][] = [
  ['BE', 'Belgique'],
  ['BJ', 'Bénin'],
  ['BF', 'Burkina Faso'],
  ['CM', 'Cameroun'],
  ['CA', 'Canada'],
  ['CI', "Côte d'Ivoire"],
  ['FR', 'France'],
  ['GA', 'Gabon'],
  ['ML', 'Mali'],
  ['MA', 'Maroc'],
  ['SN', 'Sénégal'],
  ['CH', 'Suisse'],
  ['TG', 'Togo'],
  ['TN', 'Tunisie'],
  ['Autre', 'Autre pays'],
];

export const STATUTS_COPRO: [string, string][] = [
  ['EN_CREATION', 'En création'],
  ['ACTIVE', 'Active'],
  ['INACTIVE', 'Inactive'],
  ['CLOTUREE', 'Clôturée'],
];

// Règle 1.7 : résidentiel / commercial / mixte.
export const STATUT_COPRO_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  ACTIVE: 'success',
  EN_CREATION: 'warning',
  INACTIVE: 'neutral',
  CLOTUREE: 'neutral',
};

export const TYPES_COPRO: [string, string][] = [
  ['RESIDENTIEL', 'Résidentiel'],
  ['COMMERCIAL', 'Commercial'],
  ['MIXTE', 'Mixte'],
];

// Règle 1.18 : syndic professionnel ou bénévole.
export const NATURE_SYNDIC: [string, string][] = [
  ['PROFESSIONNEL', 'Professionnel'],
  ['BENEVOLE', 'Bénévole'],
];

// Mode de génération / répartition des appels (extensions analyse).
export const MODES_REPARTITION: [string, string][] = [
  ['TANTIEMES', 'Par tantièmes'],
  ['CLES_REPARTITION', 'Par clés de répartition'],
  ['MONTANT_FIXE', 'Par montant fixe'],
  ['MIXTE', 'Mixte (hybride)'],
];

// Règle 1.13 : devise propre à la copropriété.
export const DEVISES: [string, string][] = [
  ['XOF', 'Franc CFA Ouest (XOF)'],
  ['XAF', 'Franc CFA Central (XAF)'],
  ['EUR', 'Euro (EUR)'],
  ['USD', 'Dollar US (USD)'],
  ['MAD', 'Dirham marocain (MAD)'],
  ['TND', 'Dinar tunisien (TND)'],
  ['CAD', 'Dollar canadien (CAD)'],
  ['CHF', 'Franc suisse (CHF)'],
  ['GBP', 'Livre sterling (GBP)'],
];

// Domaine 2 — désignation du lot (règle 2.5).
export const LOT_TYPES: [string, string][] = [
  ['APPARTEMENT', 'Appartement'],
  ['PARKING', 'Parking'],
  ['CAVE', 'Cave'],
  ['MAGASIN', 'Magasin'],
  ['BUREAU', 'Bureau'],
  ['ENTREPOT', 'Entrepôt'],
  ['AUTRE', 'Autre'],
];

// Domaine 2 — statuts d'occupation du lot (règles 2.16 à 2.22).
export const LOT_STATUTS: [string, string][] = [
  ['VACANT', 'Vacant'],
  ['OCCUPE_PROPRIETAIRE', 'Occupé par le propriétaire'],
  ['LOUE', 'Loué'],
  ['EN_TRAVAUX', 'En travaux'],
  ['INDISPONIBLE', 'Indisponible'],
  ['VENDU', 'Vendu'],
];

export const LOT_STATUT_TONE: Record<
  string,
  'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'
> = {
  OCCUPE_PROPRIETAIRE: 'success',
  LOUE: 'info',
  VACANT: 'neutral',
  EN_TRAVAUX: 'warning',
  INDISPONIBLE: 'warning',
  VENDU: 'danger',
};

// Domaine 3 — personne physique ou morale.
export const PERSONNE_TYPES: [string, string][] = [
  ['PHYSIQUE', 'Personne physique'],
  ['MORALE', 'Personne morale'],
];

// Coordonnées (règles 3.16 à 3.18).
export const CONTACT_TYPES: [string, string][] = [
  ['EMAIL', 'Email'],
  ['TELEPHONE', 'Téléphone'],
  ['ADRESSE_POSTALE', 'Adresse postale'],
];

// Nature du droit détenu (règles 3.7 à 3.10).
export const NATURE_DROIT: [string, string][] = [
  ['PLEINE_PROPRIETE', 'Pleine propriété'],
  ['INDIVISION', 'Indivision'],
  ['USUFRUIT', 'Usufruit'],
  ['NUE_PROPRIETE', 'Nue-propriété'],
];

// Statut d'un copropriétaire (règles 3.11, 3.21, 3.22).
export const PERSONNE_STATUTS: [string, string][] = [
  ['ACTIF', 'Actif'],
  ['SUSPENDU', 'Suspendu'],
  ['DECEDE', 'Décédé'],
  ['SUCCESSION', 'Succession'],
];

export const PERSONNE_STATUT_TONE: Record<
  string,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  ACTIF: 'success',
  SUSPENDU: 'warning',
  DECEDE: 'neutral',
  SUCCESSION: 'warning',
};

// Mode de réception des notifications (règle 3.19).
export const MODE_NOTIFICATIONS: [string, string][] = [
  ['EMAIL', 'Email'],
  ['SMS', 'SMS'],
  ['COURRIER', 'Courrier'],
  ['AUCUN', 'Aucun'],
];

// Nature d'une représentation (règles 3.5, 3.6, 3.12).
export const NATURE_REPRESENTATION: [string, string][] = [
  ['MANDATAIRE', 'Mandataire'],
  ['TUTEUR', 'Tuteur'],
  ['REPRESENTANT_LEGAL', 'Représentant légal'],
];

export const LABELS: Record<string, string> = {
  PHYSIQUE: 'Personne physique',
  MORALE: 'Personne morale',
  EMAIL: 'Email',
  TELEPHONE: 'Téléphone',
  ADRESSE_POSTALE: 'Adresse postale',
  PLEINE_PROPRIETE: 'Pleine propriété',
  INDIVISION: 'Indivision',
  USUFRUIT: 'Usufruit',
  NUE_PROPRIETE: 'Nue-propriété',
  RESIDENTIEL: 'Résidentiel',
  COMMERCIAL: 'Commercial',
  MIXTE: 'Mixte',
  PROFESSIONNEL: 'Professionnel',
  BENEVOLE: 'Bénévole',
  TANTIEMES: 'Par tantièmes',
  CLES_REPARTITION: 'Par clés de répartition',
  MONTANT_FIXE: 'Par montant fixe',
  APPARTEMENT: 'Appartement',
  PARKING: 'Parking',
  CAVE: 'Cave',
  MAGASIN: 'Magasin',
  BUREAU: 'Bureau',
  ENTREPOT: 'Entrepôt',
  AUTRE: 'Autre',
  VACANT: 'Vacant',
  OCCUPE_PROPRIETAIRE: 'Occupé par le propriétaire',
  LOUE: 'Loué',
  EN_TRAVAUX: 'En travaux',
  INDISPONIBLE: 'Indisponible',
  VENDU: 'Vendu',
  FUSIONNE: 'Fusionné',
  SUBDIVISE: 'Subdivisé',
  // Copropriétaires (domaine 3)
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  DECEDE: 'Décédé',
  SUCCESSION: 'Succession',
  SMS: 'SMS',
  COURRIER: 'Courrier',
  AUCUN: 'Aucun',
  MANDATAIRE: 'Mandataire',
  TUTEUR: 'Tuteur',
  REPRESENTANT_LEGAL: 'Représentant légal',
  // Parties communes (domaine 1.8)
  GENERALE: 'Générale',
  SPECIALE: 'Spéciale',
  // Équipements — catégories (domaine 7)
  ASCENSEUR: 'Ascenseur',
  GROUPE_ELECTROGENE: 'Groupe électrogène',
  POMPE: 'Pompe hydraulique',
  SURPRESSEUR: 'Surpresseur',
  RESERVOIR_EAU: "Réservoir d'eau",
  PORTAIL: 'Portail automatique',
  CAMERA: 'Caméra de surveillance',
  SYSTEME_INCENDIE: 'Système incendie',
  PISCINE: 'Piscine',
  CLIMATISATION: 'Climatisation collective',
  INSTALLATION_ELECTRIQUE: 'Installation électrique',
  ECLAIRAGE: 'Éclairage commun',
  CONTROLE_ACCES: "Contrôle d'accès",
  // Équipements — états (domaine 7)
  EN_SERVICE: 'En service',
  EN_PANNE: 'En panne',
  EN_MAINTENANCE: 'En maintenance',
  HORS_SERVICE: 'Hors service',
  REMPLACE: 'Remplacé',
  // Accès (domaine 1.9)
  PIETON: 'Piéton',
  VEHICULE: 'Véhicule',
  LIVRAISON: 'Livraison',
  SECOURS: 'Secours',
};

// Domaine 1.9 : types d'accès d'une copropriété.
export const ACCES_TYPES: [string, string][] = [
  ['PIETON', 'Piéton'],
  ['VEHICULE', 'Véhicule'],
  ['PARKING', 'Parking'],
  ['LIVRAISON', 'Livraison'],
  ['SECOURS', 'Secours'],
  ['AUTRE', 'Autre'],
];

// Règle 1.8 : parties communes générales ou spéciales.
export const PARTIE_COMMUNE_TYPES: [string, string][] = [
  ['GENERALE', 'Générale'],
  ['SPECIALE', 'Spéciale'],
];

// Domaine 7 : catégories d'équipements (exemples de l'analyse).
export const EQUIPEMENT_CATEGORIES: [string, string][] = [
  ['ASCENSEUR', 'Ascenseur'],
  ['GROUPE_ELECTROGENE', 'Groupe électrogène'],
  ['POMPE', 'Pompe hydraulique'],
  ['SURPRESSEUR', 'Surpresseur'],
  ['RESERVOIR_EAU', "Réservoir d'eau"],
  ['PORTAIL', 'Portail automatique'],
  ['CAMERA', 'Caméra de surveillance'],
  ['SYSTEME_INCENDIE', 'Système incendie'],
  ['PISCINE', 'Piscine'],
  ['CLIMATISATION', 'Climatisation collective'],
  ['INSTALLATION_ELECTRIQUE', 'Installation électrique'],
  ['ECLAIRAGE', 'Éclairage commun'],
  ['CONTROLE_ACCES', "Contrôle d'accès"],
  ['AUTRE', 'Autre'],
];

// Domaine 7 : cycle de vie d'un équipement.
export const EQUIPEMENT_ETATS: [string, string][] = [
  ['EN_SERVICE', 'En service'],
  ['EN_PANNE', 'En panne'],
  ['EN_MAINTENANCE', 'En maintenance'],
  ['HORS_SERVICE', 'Hors service'],
  ['REMPLACE', 'Remplacé'],
];

export const EQUIPEMENT_ETAT_TONE: Record<
  string,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  EN_SERVICE: 'success',
  EN_PANNE: 'danger',
  EN_MAINTENANCE: 'warning',
  HORS_SERVICE: 'neutral',
  REMPLACE: 'neutral',
};
