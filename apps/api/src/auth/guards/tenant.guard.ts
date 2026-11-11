import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth-user.interface';

// Isolation multi-tenant : pour toute route avec :coproprieteId, vérifie que la
// copropriété appartient au syndic de l'utilisateur.
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = req.user;
    const coproprieteId: string | undefined = req.params?.coproprieteId;
    if (!user || !coproprieteId) return true; // rien à vérifier ici

    const copro = await this.prisma.copropriete.findUnique({
      where: { id: coproprieteId },
      select: { syndicId: true },
    });
    if (!copro) {
      throw new NotFoundException(`Copropriété ${coproprieteId} introuvable`);
    }
    if (copro.syndicId !== user.syndicId) {
      throw new ForbiddenException('Copropriété hors de votre périmètre');
    }
    return true;
  }
}
