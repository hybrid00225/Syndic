import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface UserLike {
  id: string;
  email: string;
  nom: string;
  syndicId: string;
  adminSyndic: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Inscription : crée le syndic + son premier administrateur.
  async register(dto: RegisterDto) {
    const existant = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existant) {
      throw new ConflictException('Cet email est déjà utilisé');
    }
    const hash = await bcrypt.hash(dto.motDePasse, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const syndic = await tx.syndic.create({
        data: {
          nom: dto.syndicNom,
          pays: dto.pays,
          devise: dto.devise ?? 'XOF',
        },
      });
      return tx.user.create({
        data: {
          syndicId: syndic.id,
          email: dto.email,
          motDePasse: hash,
          nom: dto.nom,
          adminSyndic: true,
        },
      });
    });

    return this.reponseToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.actif) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const ok = await bcrypt.compare(dto.motDePasse, user.motDePasse);
    if (!ok) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.reponseToken(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nom: true,
        syndicId: true,
        adminSyndic: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async reponseToken(user: UserLike) {
    const token = await this.jwt.signAsync({
      sub: user.id,
      syndicId: user.syndicId,
      adminSyndic: user.adminSyndic,
      email: user.email,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        syndicId: user.syndicId,
        adminSyndic: user.adminSyndic,
      },
    };
  }
}
