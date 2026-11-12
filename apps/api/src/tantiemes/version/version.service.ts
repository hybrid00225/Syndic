import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class VersionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(cleId: string, dto: CreateVersionDto) {
    const cle = await this.prisma.cleRepartition.findUnique({
      where: { id: cleId },
      select: { id: true, coproprieteId: true },
    });
    if (!cle) {
      throw new NotFoundException(`Clé de répartition ${cleId} introuvable`);
    }

    const items = dto.tantiemes;
    const total = await this.validerItems(cle.coproprieteId, items);
    const dateEffet = new Date(dto.dateEffet);

    // RG-21 : la nouvelle version doit être postérieure à la version courante.
    const courante = await this.prisma.cleRepartitionVersion.findFirst({
      where: { cleId, dateFin: null },
    });
    if (courante && courante.dateEffet.getTime() >= dateEffet.getTime()) {
      throw new BadRequestException(
        "La date d'effet doit être postérieure à celle de la version courante",
      );
    }

    // Transaction : clôturer la version courante + créer la nouvelle + tantièmes.
    return this.prisma.$transaction(async (tx) => {
      if (courante) {
        await tx.cleRepartitionVersion.update({
          where: { id: courante.id },
          data: { dateFin: dateEffet },
        });
      }
      const version = await tx.cleRepartitionVersion.create({
        data: { cleId, dateEffet, totalTantiemes: total },
      });
      await tx.tantieme.createMany({
        data: items.map((i) => ({
          versionId: version.id,
          lotId: i.lotId,
          valeur: i.valeur,
        })),
      });
      return tx.cleRepartitionVersion.findUnique({
        where: { id: version.id },
        include: { tantiemes: true },
      });
    });
  }

  // Corrige la version courante SUR PLACE (même date d'effet) tant qu'aucun
  // appel de fonds ne s'en sert — pratique pour ajuster les tantièmes amorcés
  // à la création. Dès que la version a servi, il faut en créer une nouvelle.
  async corrigerCourante(cleId: string, dto: CreateVersionDto) {
    const cle = await this.prisma.cleRepartition.findUnique({
      where: { id: cleId },
      select: { id: true, coproprieteId: true },
    });
    if (!cle) {
      throw new NotFoundException(`Clé de répartition ${cleId} introuvable`);
    }
    const courante = await this.prisma.cleRepartitionVersion.findFirst({
      where: { cleId, dateFin: null },
    });
    if (!courante) {
      throw new BadRequestException(
        "Aucune version courante à corriger : créez une première version",
      );
    }
    // Si un poste d'appel référence cette version, elle est figée (traçabilité).
    const utilisee = await this.prisma.posteAppel.count({
      where: { cleVersionId: courante.id },
    });
    if (utilisee > 0) {
      throw new BadRequestException(
        'Cette version a déjà servi à un appel de fonds : créez une nouvelle version datée plutôt que de la corriger',
      );
    }

    const total = await this.validerItems(cle.coproprieteId, dto.tantiemes);

    return this.prisma.$transaction(async (tx) => {
      await tx.tantieme.deleteMany({ where: { versionId: courante.id } });
      await tx.tantieme.createMany({
        data: dto.tantiemes.map((i) => ({
          versionId: courante.id,
          lotId: i.lotId,
          valeur: i.valeur,
        })),
      });
      return tx.cleRepartitionVersion.update({
        where: { id: courante.id },
        data: {
          totalTantiemes: total,
          // Une correction peut aussi redater la version (si pas encore utilisée).
          dateEffet: new Date(dto.dateEffet),
        },
        include: { tantiemes: true },
      });
    });
  }

  findByCle(cleId: string) {
    return this.prisma.cleRepartitionVersion.findMany({
      where: { cleId },
      orderBy: { dateEffet: 'desc' },
    });
  }

  // Contrôles RG-18 à RG-20 partagés ; renvoie le total (RG-19 : > 0).
  private async validerItems(
    coproprieteId: string,
    items: { lotId: string; valeur: number }[],
  ) {
    const lotIds = items.map((i) => i.lotId);
    if (new Set(lotIds).size !== lotIds.length) {
      throw new BadRequestException(
        'Un même lot apparaît plusieurs fois dans la version',
      );
    }
    const lots = await this.prisma.lot.findMany({
      where: { id: { in: lotIds }, coproprieteId },
      select: { id: true },
    });
    if (lots.length !== lotIds.length) {
      throw new BadRequestException(
        "Un lot n'appartient pas à la copropriété de cette clé",
      );
    }
    const total = items.reduce((acc, i) => acc + i.valeur, 0);
    if (total <= 0) {
      throw new BadRequestException(
        'Le total des tantièmes doit être strictement positif',
      );
    }
    return total;
  }

  // RG-22 : version applicable à une date (dateEffet ≤ D < dateFin ou dateFin null).
  async applicableAt(cleId: string, date: string) {
    const d = new Date(date);
    const version = await this.prisma.cleRepartitionVersion.findFirst({
      where: {
        cleId,
        dateEffet: { lte: d },
        OR: [{ dateFin: null }, { dateFin: { gt: d } }],
      },
      include: { tantiemes: true },
    });
    if (!version) {
      throw new NotFoundException(
        `Aucune version applicable à la date ${date} pour la clé ${cleId}`,
      );
    }
    return version;
  }
}
