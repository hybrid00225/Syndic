// Utilisateur authentifié, extrait du JWT et attaché à la requête (req.user).
export interface AuthUser {
  userId: string;
  syndicId: string;
  adminSyndic: boolean;
  email: string;
}
