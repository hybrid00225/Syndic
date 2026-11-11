import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoproprieteDto } from './dto/create-copropriete.dto';
import { UpdateCoproprieteDto } from './dto/update-copropriete.dto';

@Injectable()
export class CoproprieteService {
  constructor(private readonly prisma: PrismaService) {}

  // RG-07 : création → statut initial EN_CREATION (défaut du schéma).
  async create(dto: CreateCoproprieteDto) {
    const syndic = await this.prisma.syndic.findUnique({
      where: { id: dto.syndicId },
    });
    if (!syndic) {
      throw new NotFoundException(`Syndic ${dto.syndicId} introuvable`);
    }
    return this.prisma.copropriete.create({
      data: {
        syndicId: dto.syndicId,
        nom: dto.nom,
        pays: dto.pays,
        devise: dto.devise ?? 'XOF',
        adresse: dto.adresse,
      },
    });
  }

  findAll(syndicId?: string) {
    return this.prisma.copropriete.findMany({
      where: syndicId ? { syndicId } : undefined,
      orderBy: { dateCreation: 'desc' },
    });
  }

  async findOne(id: string) {
    const copropriete = await this.prisma.copropriete.findUnique({
      where: { id },
      include: { batiments: true },
    });
    if (!copropriete) {
      throw new NotFoundException(`Copropriété ${id} introuvable`);
    }
    return copropriete;
  }

  async update(id: string, dto: UpdateCoproprieteDto) {
    await this.ensureExists(id);
    return this.prisma.copropriete.update({ where: { id }, data: { ...dto } });
  }

  // Utilitaire partagé : garantit l'existence (sinon 404).
  async ensureExists(id: string) {
    const exists = await this.prisma.copropriete.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Copropriété ${id} introuvable`);
    }
  }
}
