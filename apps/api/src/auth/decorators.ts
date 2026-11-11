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

// @Roles(...) : rôles autorisés (sur la copropriété de la route). L'admin du syndic passe toujours.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);

// @CurrentUser() : injecte l'utilisateur authentifié.
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
