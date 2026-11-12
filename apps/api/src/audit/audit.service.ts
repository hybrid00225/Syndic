import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { deriveAudit } from './audit-derive';
import { AuthUser } from '../auth/auth-user.interface';

interface RequeteAuditable {
  method: string;
  route?: { path?: string };
  url: string;
  params?: Record<string, string>;
  user?: AuthUser;
  coproprieteIdResolu?: string; // posé par TenantGuard (ressource parente)
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  // Enregistre une entrée d'audit (append-only). N'échoue jamais la requête.
  async enregistrer(req: RequeteAuditable, resultat: unknown): Promise<void> {
    const user = req.user;
    if (!user) return;

    const routePath = req.route?.path ?? req.url.split('?')[0];
    const { entite, action } = deriveAudit(req.method, routePath);

    const resultatId =
      resultat && typeof resultat === 'object' && 'id' in resultat
        ? String((resultat as { id: unknown }).id)
        : undefined;
    const entiteId = resultatId ?? req.params?.id ?? 'n/a';

    // BigInt/Date sérialisés via toJSON (configuré dans main.ts) → JSON valide.
    const apres =
      resultat !== undefined && resultat !== null
        ? JSON.parse(JSON.stringify(resultat))
        : undefined;

    await this.prisma.auditLog.create({
      data: {
        syndicId: user.syndicId,
        coproprieteId: req.params?.coproprieteId ?? req.coproprieteIdResolu ?? null,
        userId: user.userId,
        entite,
        entiteId,
        action,
        apres,
      },
    });
  }

  // Consultation (admin), filtrable par entité/instance.
  query(
    syndicId: string,
    filtres: { entite?: string; entiteId?: string; coproprieteId?: string },
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        syndicId,
        entite: filtres.entite || undefined,
        entiteId: filtres.entiteId || undefined,
        coproprieteId: filtres.coproprieteId || undefined,
      },
      orderBy: { horodatage: 'desc' },
      take: 100,
    });
  }
}
