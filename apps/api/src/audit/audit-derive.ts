// Déduit l'entité et l'action auditées à partir de la méthode HTTP et du
// motif de route (ex. "/coproprietes/:coproprieteId/appels"). Fonction pure.

const RESOURCE_ENTITE: Record<string, string> = {
  coproprietes: 'Copropriete',
  batiments: 'Batiment',
  niveaux: 'Niveau',
  lots: 'Lot',
  personnes: 'Personne',
  contacts: 'Contact',
  detentions: 'DetentionPropriete',
  cles: 'CleRepartition',
  versions: 'CleRepartitionVersion',
  appels: 'AppelDeFonds',
  paiements: 'Paiement',
  affectations: 'AffectationPaiement',
  relances: 'Relance',
  users: 'User',
};

const METHOD_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

// Verbes de route qui portent une action spécifique (sinon = action de la méthode).
const VERB_ACTION: Record<string, string> = {
  valider: 'VALIDATE',
  annuler: 'CANCEL',
};

export interface AuditDerive {
  entite: string;
  action: string;
}

export function deriveAudit(method: string, routePath: string): AuditDerive {
  const segs = routePath
    .split('/')
    .filter((s) => s && !s.startsWith(':'));
  const last = segs[segs.length - 1] ?? 'root';

  let action: string;
  let resourceSeg: string;
  if (VERB_ACTION[last]) {
    action = VERB_ACTION[last];
    resourceSeg = segs[segs.length - 2] ?? last;
  } else {
    action = METHOD_ACTION[method] ?? method;
    resourceSeg = last;
  }

  return { entite: RESOURCE_ENTITE[resourceSeg] ?? resourceSeg, action };
}
