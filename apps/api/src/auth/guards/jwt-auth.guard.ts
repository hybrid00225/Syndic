import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../auth-user.interface';
import { IS_PUBLIC_KEY } from '../decorators';

// Valide le JWT (sauf routes @Public), vérifie que l'utilisateur existe toujours
// et est actif, puis attache req.user avec ses droits relus en base.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException("Jeton d'authentification manquant");
    }

    let sub: unknown;
    try {
      const payload = await this.jwt.verifyAsync(header.slice(7), {
        algorithms: ['HS256'],
      });
      sub = payload?.sub;
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }
    if (typeof sub !== 'string' || !sub) {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: sub },
      select: {
        id: true,
        email: true,
        actif: true,
        syndicId: true,
        adminSyndic: true,
        roles: { select: { coproprieteId: true, role: true } },
      },
    });
    if (!user || !user.actif) {
      throw new UnauthorizedException('Compte inexistant ou désactivé');
    }

    const authUser: AuthUser = {
      userId: user.id,
      syndicId: user.syndicId,
      adminSyndic: user.adminSyndic,
      email: user.email,
      roles: user.roles,
    };
    req.user = authUser;
    return true;
  }
}
