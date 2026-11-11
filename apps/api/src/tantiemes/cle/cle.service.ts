import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoproprieteService } from '../../patrimoine/copropriete/copropriete.service';
import { CreateCleDto } from './dto/create-cle.dto';
import { UpdateCleDto } from './dto/update-cle.dto';

@Injectable()
export class CleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coproprietes: CoproprieteService,
  ) {}

  // RG-17 : une clé appartient à une copropriété existante.
  async create(coproprieteId: string, dto: CreateCleDto) {
    await this.coproprietes.ensureExists(coproprieteId);
    return this.prisma.cleRepartition.create({
      data: { coproprieteId, nom: dto.nom, description: dto.description },
    });
  }

  findAll(coproprieteId: string) {
    return this.prisma.cleRepartition.findMany({
      where: { coproprieteId },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const cle = await this.prisma.cleRepartition.findUnique({
      where: { id },
      include: { versions: { orderBy: { dateEffet: 'desc' } } },
    });
    if (!cle) {
      throw new NotFoundException(`Clé de répartition ${id} introuvable`);
    }
    return cle;
  }

  async update(id: string, dto: UpdateCleDto) {
    await this.ensureExists(id);
    return this.prisma.cleRepartition.update({ where: { id }, data: { ...dto } });
  }

  async ensureExists(id: string) {
    const exists = await this.prisma.cleRepartition.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Clé de répartition ${id} introuvable`);
    }
  }
}
