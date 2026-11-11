// Liste internationale (le produit n'est pas restreint à une région).
export const PAYS: [string, string][] = [
  ['CI', "Côte d'Ivoire"],
  ['SN', 'Sénégal'],
  ['CM', 'Cameroun'],
  ['GA', 'Gabon'],
  ['BJ', 'Bénin'],
  ['BF', 'Burkina Faso'],
  ['ML', 'Mali'],
  ['TG', 'Togo'],
  ['MA', 'Maroc'],
  ['TN', 'Tunisie'],
  ['FR', 'France'],
  ['BE', 'Belgique'],
  ['CH', 'Suisse'],
  ['CA', 'Canada'],
  ['Autre', 'Autre'],
];

export const STATUTS_COPRO: [string, string][] = [
  ['EN_CREATION', 'En création'],
  ['ACTIVE', 'Active'],
  ['INACTIVE', 'Inactive'],
  ['CLOTUREE', 'Clôturée'],
];

// Règle 1.7 : résidentiel / commercial / mixte.
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

export const LABELS: Record<string, string> = {
  RESIDENTIEL: 'Résidentiel',
  COMMERCIAL: 'Commercial',
  MIXTE: 'Mixte',
  PROFESSIONNEL: 'Professionnel',
  BENEVOLE: 'Bénévole',
};
