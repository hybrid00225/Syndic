import { RoleType } from '@prisma/client';

// Utilisateur authentifié attaché à la requête (req.user). Les droits
// (syndicId, adminSyndic, rôles) sont relus en base à chaque requête : une
// désactivation ou un retrait de droits prend effet immédiatement, sans
// attendre l'expiration du jeton.
export interface AuthUser {
  userId: string;
  syndicId: string;
  adminSyndic: boolean;
  email: string;
  roles: { coproprieteId: string; role: RoleType }[];
}

// Copropriétés visibles par l'utilisateur : undefined = toutes celles du syndic
// (administrateur), sinon la liste des copropriétés où il a au moins un rôle.
export function perimetreCoproprietes(user: AuthUser): string[] | undefined {
  if (user.adminSyndic) return undefined;
  return [...new Set(user.roles.map((r) => r.coproprieteId))];
}
