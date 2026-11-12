import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Coût bcrypt (≈ 250 ms) : compromis sécurité / latence de connexion.
export const BCRYPT_COUT = 12;

// Hash factice comparé quand l'email est inconnu : le temps de réponse est
// alors le même que pour un mauvais mot de passe (pas d'énumération des comptes).
const HASH_FACTICE = bcrypt.hashSync('mot-de-passe-factice-0', BCRYPT_COUT);

interface UserLike {
  id: string;
  email: string;
  nom: string;
  syndicId: string;
  adminSyndic: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('Auth');

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
      this.logger.warn(`Inscription refusée : email déjà utilisé (${dto.email})`);
      throw new ConflictException('Cet email est déjà utilisé');
    }
    const hash = await bcrypt.hash(dto.motDePasse, BCRYPT_COUT);

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

    this.logger.log(`Inscription : syndic ${user.syndicId}, admin ${user.id}`);
    return this.reponseToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Toujours un bcrypt.compare, même si l'utilisateur n'existe pas (timing).
    const ok = await bcrypt.compare(
      dto.motDePasse,
      user?.motDePasse ?? HASH_FACTICE,
    );
    if (!user || !ok || !user.actif) {
      this.logger.warn(
        `Échec de connexion pour ${dto.email} (${!user ? 'compte inconnu' : !ok ? 'mot de passe erroné' : 'compte désactivé'})`,
      );
      throw new UnauthorizedException('Identifiants invalides');
    }
    this.logger.log(`Connexion réussie : utilisateur ${user.id}`);
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
    // Le jeton ne porte que l'identité : les droits sont relus en base à chaque
    // requête (JwtAuthGuard). syndicId/adminSyndic restent pour compatibilité front.
    const token = await this.jwt.signAsync({
      sub: user.id,
      syndicId: user.syndicId,
      adminSyndic: user.adminSyndic,
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
