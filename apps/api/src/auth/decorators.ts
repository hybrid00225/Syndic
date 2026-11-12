import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { AuthUser } from './auth-user.interface';

// @Public() : route accessible sans authentification.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// @Roles(...) : rôles autorisés (sur la copropriété concernée par la route,
// résolue par TenantGuard). L'admin du syndic passe toujours.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);

// @AdminSyndic() : réservé à l'administrateur du syndic.
export const ADMIN_SYNDIC_KEY = 'adminSyndic';
export const AdminSyndic = () => SetMetadata(ADMIN_SYNDIC_KEY, true);

// @CurrentUser() : injecte l'utilisateur authentifié.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
