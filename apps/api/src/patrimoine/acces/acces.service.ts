import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../copropriete/copropriete.service';
import { CreateAccesDto } from './dto/create-acces.dto';
import { UpdateAccesDto } from './dto/update-acces.dto';

@Injectable()
export class AccesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  async create(coproprieteId: string, dto: CreateAccesDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    if (dto.batimentId) {
      await this.verifierBatiment(coproprieteId, dto.batimentId);
    }
    return this.prisma.acces.create({
      data: {
        coproprieteId,
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        batimentId: dto.batimentId,
      },
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.acces.findMany({
      where: { coproprieteId },
      orderBy: { nom: 'asc' },
      include: { batiment: { select: { id: true, nom: true } } },
    });
  }

  async update(id: string, dto: UpdateAccesDto) {
    const acces = await this.ensureExists(id);
    if (dto.batimentId) {
      await this.verifierBatiment(acces.coproprieteId, dto.batimentId);
    }
    return this.prisma.acces.update({
      where: { id },
      data: {
        nom: dto.nom,
        type: dto.type,
        description: dto.description,
        batimentId: dto.batimentId,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.acces.delete({ where: { id } });
    return { id, supprime: true };
  }

  private async ensureExists(id: string) {
    const acces = await this.prisma.acces.findUnique({
      where: { id },
      select: { id: true, coproprieteId: true },
    });
    if (!acces) {
      throw new NotFoundException(`Accès ${id} introuvable`);
    }
    return acces;
  }

  private async verifierBatiment(coproprieteId: string, batimentId: string) {
    const bat = await this.prisma.batiment.findUnique({
      where: { id: batimentId },
      select: { coproprieteId: true },
    });
    if (!bat) {
      throw new NotFoundException(`Bâtiment ${batimentId} introuvable`);
    }
    if (bat.coproprieteId !== coproprieteId) {
      throw new BadRequestException(
        "Le bâtiment n'appartient pas à cette copropriété",
      );
    }
  }
}
