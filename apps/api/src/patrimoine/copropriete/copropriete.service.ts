import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCoproprieteDto } from './dto/create-copropriete.dto';
import { UpdateCoproprieteDto } from './dto/update-copropriete.dto';

@Injectable()
export class CoproprieteService {
  constructor(private readonly prisma: PrismaService) {}

  // RG-07 : création → statut initial EN_CREATION (défaut du schéma).
  // syndicId provient du token (garanti valide).
  create(dto: CreateCoproprieteDto, syndicId: string) {
    return this.prisma.copropriete.create({
      data: {
        syndicId,
        nom: dto.nom,
        reference: dto.reference,
        type: dto.type,
        pays: dto.pays,
        adresse: dto.adresse,
        ensembleImmobilier: dto.ensembleImmobilier,
        devise: dto.devise ?? 'XOF',
        natureSyndic: dto.natureSyndic,
        description: dto.description,
        dateMiseExploitation: dto.dateMiseExploitation
          ? new Date(dto.dateMiseExploitation)
          : undefined,
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
    const { dateMiseExploitation, ...rest } = dto;
    return this.prisma.copropriete.update({
      where: { id },
      data: {
        ...rest,
        ...(dateMiseExploitation !== undefined
          ? { dateMiseExploitation: new Date(dateMiseExploitation) }
          : {}),
      },
    });
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
