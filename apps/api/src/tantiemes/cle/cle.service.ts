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

  // Liste des clés + résumé de leur version courante (total de tantièmes,
  // nombre de lots couverts) pour l'écran de configuration de la répartition.
  async findAll(coproprieteId: string) {
    const cles = await this.prisma.cleRepartition.findMany({
      where: { coproprieteId },
      orderBy: { nom: 'asc' },
      include: {
        versions: {
          where: { dateFin: null },
          include: { _count: { select: { tantiemes: true } } },
        },
      },
    });
    return cles.map((c) => {
      const courante = c.versions[0];
      return {
        id: c.id,
        coproprieteId: c.coproprieteId,
        nom: c.nom,
        description: c.description,
        versionCourante: courante
          ? {
              id: courante.id,
              dateEffet: courante.dateEffet,
              totalTantiemes: courante.totalTantiemes,
              nbLots: courante._count.tantiemes,
            }
          : null,
      };
    });
  }

  // Détail d'une clé : toutes ses versions (avec tantièmes) + la liste complète
  // des lots de la copropriété, pour éditer la grille de répartition.
  async findOne(id: string) {
    const cle = await this.prisma.cleRepartition.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { dateEffet: 'desc' },
          include: { tantiemes: true },
        },
      },
    });
    if (!cle) {
      throw new NotFoundException(`Clé de répartition ${id} introuvable`);
    }
    const lots = await this.prisma.lot.findMany({
      where: { coproprieteId: cle.coproprieteId },
      select: {
        id: true,
        reference: true,
        type: true,
        superficie: true,
        batiment: { select: { nom: true } },
      },
      orderBy: { reference: 'asc' },
    });
    return { ...cle, lots };
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
