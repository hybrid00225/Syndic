import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { AuthUser } from '../auth-user.interface';
import { ADMIN_SYNDIC_KEY, ROLES_KEY } from '../decorators';
import { RequetePerimetre } from './tenant.guard';

// Vérifie @AdminSyndic et les rôles requis (@Roles). L'admin du syndic passe
// toujours. Sinon l'utilisateur doit avoir l'un des rôles (ou ADMIN_SYNDIC) sur
// la copropriété concernée, résolue par TenantGuard (paramètre de route direct
// ou ressource parente). Pour une ressource hors copropriété (ex. personne), un
// des rôles sur au moins une copropriété du syndic suffit.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const cibles = [ctx.getHandler(), ctx.getClass()];
    const adminRequis = this.reflector.getAllAndOverride<boolean>(
      ADMIN_SYNDIC_KEY,
      cibles,
    );
    const requis = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, cibles);
    if (!adminRequis && (!requis || requis.length === 0)) return true;

    const req = ctx.switchToHttp().getRequest<RequetePerimetre>();
    const user: AuthUser | undefined = req.user;
    if (!user) throw new ForbiddenException();
    if (user.adminSyndic) return true;
    if (adminRequis) {
      throw new ForbiddenException("Réservé à l'administrateur du syndic");
    }

    const coproprieteId = req.coproprieteIdResolu;
    const ok = user.roles.some(
      (r) =>
        (coproprieteId ? r.coproprieteId === coproprieteId : true) &&
        (requis.includes(r.role) || r.role === RoleType.ADMIN_SYNDIC),
    );
    if (!ok) {
      throw new ForbiddenException('Rôle insuffisant pour cette opération');
    }
    return true;
  }
}
