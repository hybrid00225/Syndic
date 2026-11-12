import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth-user.interface';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Requête enrichie par TenantGuard (copropriété résolue pour RolesGuard / audit).
export interface RequetePerimetre extends Request {
  user?: AuthUser;
  coproprieteIdResolu?: string;
}

interface Appartenance {
  syndicId: string;
  coproprieteId: string | null;
}

type Resolveur = (
  prisma: PrismaService,
  id: string,
) => Promise<Appartenance | null>;

const viaCopro = { coproprieteId: true, copropriete: { select: { syndicId: true } } } as const;
const depuisCopro = (
  r: { coproprieteId: string; copropriete: { syndicId: string } } | null,
): Appartenance | null =>
  r ? { syndicId: r.copropriete.syndicId, coproprieteId: r.coproprieteId } : null;

const personne: Resolveur = async (p, id) => {
  const r = await p.personne.findUnique({ where: { id }, select: { syndicId: true } });
  return r ? { syndicId: r.syndicId, coproprieteId: null } : null;
};

// Segment de route précédant un paramètre → résolution du syndic / de la
// copropriété propriétaire. Toute route dont un paramètre suit un segment
// absent de cette table est REFUSÉE (fail closed) : une nouvelle route doit
// être déclarée ici pour être accessible.
export const RESOLVEURS: Record<string, Resolveur> = {
  coproprietes: async (p, id) => {
    const r = await p.copropriete.findUnique({ where: { id }, select: { id: true, syndicId: true } });
    return r ? { syndicId: r.syndicId, coproprieteId: r.id } : null;
  },
  batiments: async (p, id) =>
    depuisCopro(await p.batiment.findUnique({ where: { id }, select: viaCopro })),
  niveaux: async (p, id) => {
    const r = await p.niveau.findUnique({ where: { id }, select: { batiment: { select: viaCopro } } });
    return r ? depuisCopro(r.batiment) : null;
  },
  lots: async (p, id) =>
    depuisCopro(await p.lot.findUnique({ where: { id }, select: viaCopro })),
  personnes: personne,
  releve: personne, // appels/:id/releve/:personneId
  detentions: async (p, id) => {
    const r = await p.detentionPropriete.findUnique({ where: { id }, select: { lot: { select: viaCopro } } });
    return r ? depuisCopro(r.lot) : null;
  },
  cles: async (p, id) =>
    depuisCopro(await p.cleRepartition.findUnique({ where: { id }, select: viaCopro })),
  appels: async (p, id) =>
    depuisCopro(await p.appelDeFonds.findUnique({ where: { id }, select: viaCopro })),
  paiements: async (p, id) =>
    depuisCopro(await p.paiement.findUnique({ where: { id }, select: viaCopro })),
  affectations: async (p, id) => {
    const r = await p.affectationPaiement.findUnique({ where: { id }, select: { paiement: { select: viaCopro } } });
    return r ? depuisCopro(r.paiement) : null;
  },
  budgets: async (p, id) =>
    depuisCopro(await p.budget.findUnique({ where: { id }, select: viaCopro })),
  exercices: async (p, id) =>
    depuisCopro(await p.exercice.findUnique({ where: { id }, select: viaCopro })),
  equipements: async (p, id) =>
    depuisCopro(await p.equipement.findUnique({ where: { id }, select: viaCopro })),
  'parties-communes': async (p, id) =>
    depuisCopro(await p.partieCommune.findUnique({ where: { id }, select: viaCopro })),
  acces: async (p, id) =>
    depuisCopro(await p.acces.findUnique({ where: { id }, select: viaCopro })),
  'reglement-versions': async (p, id) =>
    depuisCopro(await p.reglementVersion.findUnique({ where: { id }, select: viaCopro })),
  documents: async (p, id) =>
    p.document.findUnique({ where: { id }, select: { syndicId: true, coproprieteId: true } }),
};

// Extrait les couples (segment ressource, nom du paramètre) d'un motif de route.
// Ex. "/appels/:id/releve/:personneId" → [["appels","id"],["releve","personneId"]].
export function paramsDeRoute(chemin: string): [string, string][] {
  const segs = chemin.split('/').filter(Boolean);
  const res: [string, string][] = [];
  segs.forEach((s, i) => {
    if (s.startsWith(':')) res.push([segs[i - 1] ?? '', s.slice(1)]);
  });
  return res;
}

// Isolation multi-tenant centralisée : pour CHAQUE paramètre d'identifiant de
// la route, charge la ressource et vérifie qu'elle appartient au syndic de
// l'utilisateur (et, pour un non-administrateur, à une copropriété où il a un
// rôle). Réponse 404 sinon, pour ne pas révéler l'existence de la ressource.
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequetePerimetre>();
    const user = req.user;
    if (!user) return true; // route publique : rien à vérifier

    const chemin: string = req.route?.path ?? '';
    for (const [ressource, nomParam] of paramsDeRoute(chemin)) {
      const id = req.params?.[nomParam];
      if (!id) continue;
      // Identifiant mal formé : ParseUUIDPipe renverrait 400 ; on évite la requête.
      if (!UUID_RE.test(id)) {
        throw new BadRequestException(`Identifiant invalide : ${nomParam}`);
      }
      const resoudre = RESOLVEURS[ressource];
      if (!resoudre) {
        this.logger.error(
          `Route « ${chemin} » : paramètre :${nomParam} sans résolveur de périmètre (accès refusé)`,
        );
        throw new NotFoundException('Ressource introuvable');
      }

      const app = await resoudre(this.prisma, id);
      if (!app || app.syndicId !== user.syndicId) {
        throw new NotFoundException('Ressource introuvable');
      }
      if (app.coproprieteId) {
        if (
          !user.adminSyndic &&
          !user.roles.some((r) => r.coproprieteId === app.coproprieteId)
        ) {
          throw new NotFoundException('Ressource introuvable');
        }
        // La première copropriété résolue sert de contexte aux rôles et à l'audit.
        req.coproprieteIdResolu ??= app.coproprieteId;
        if (req.coproprieteIdResolu !== app.coproprieteId) {
          throw new NotFoundException('Ressource introuvable');
        }
      }
    }
    return true;
  }
}
