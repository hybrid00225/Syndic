import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
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
    for (const r of dto.roles ?? []) {
      const copro = await this.prisma.copropriete.findUnique({
        where: { id: r.coproprieteId },
        select: { syndicId: true },
      });
      if (!copro || copro.syndicId !== syndicId) {
        throw new BadRequestException(
          `Copropriété ${r.coproprieteId} hors de votre syndic`,
        );
      }
    }

    const hash = await bcrypt.hash(dto.motDePasse, 10);
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
