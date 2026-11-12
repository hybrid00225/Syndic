import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_COUT } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Création d'un utilisateur dans le syndic de l'admin, avec ses rôles.
  async create(syndicId: string, dto: CreateUserDto) {
    const existant = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existant) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Les copropriétés des rôles doivent appartenir au syndic.
    const coproIds = [...new Set((dto.roles ?? []).map((r) => r.coproprieteId))];
    if (coproIds.length) {
      const trouvees = await this.prisma.copropriete.count({
        where: { id: { in: coproIds }, syndicId },
      });
      if (trouvees !== coproIds.length) {
        throw new BadRequestException('Une copropriété des rôles est hors de votre syndic');
      }
    }

    const hash = await bcrypt.hash(dto.motDePasse, BCRYPT_COUT);
    return this.prisma.user.create({
      data: {
        syndicId,
        email: dto.email,
        motDePasse: hash,
        nom: dto.nom,
        adminSyndic: dto.adminSyndic ?? false,
        roles: dto.roles?.length
          ? {
              create: dto.roles.map((r) => ({
                coproprieteId: r.coproprieteId,
                role: r.role,
              })),
            }
          : undefined,
      },
      select: { id: true, email: true, nom: true, adminSyndic: true },
    });
  }

  findAll(syndicId: string) {
    return this.prisma.user.findMany({
      where: { syndicId },
      select: {
        id: true,
        email: true,
        nom: true,
        adminSyndic: true,
        actif: true,
      },
      orderBy: { nom: 'asc' },
    });
  }
}
