import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth-user.interface';
import { ROLES_KEY } from '../decorators';

// Vérifie les rôles requis (@Roles). L'admin du syndic passe toujours ;
// sinon l'utilisateur doit avoir l'un des rôles sur la copropriété concernée.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requis = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requis || requis.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user: AuthUser | undefined = req.user;
    if (!user) throw new ForbiddenException();
    if (user.adminSyndic) return true;

    const coproprieteId: string | undefined = req.params?.coproprieteId;
    if (!coproprieteId) {
      throw new ForbiddenException('Rôle requis mais copropriété non précisée');
    }
    const role = await this.prisma.userCoproprieteRole.findFirst({
      where: { userId: user.userId, coproprieteId, role: { in: requis } },
      select: { id: true },
    });
    if (!role) {
      throw new ForbiddenException('Rôle insuffisant pour cette opération');
    }
    return true;
  }
}
